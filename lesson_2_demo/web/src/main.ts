/**
 * Application Entry Point for Lesson 3: Views Showcase
 *
 * E-Commerce demo with role-based routing and component showcase.
 */

// ECharts full import - registers all renderers and components
import 'echarts';

import { createApp } from 'vue';
import { createRouter, createWebHistory, type RouteLocationNormalized } from 'vue-router';
import { createPinia } from 'pinia';
import App from './App.vue';
import { initApp, initAxios, loadLocaleMessagesEager, deepMerge, installComponents, axiosGet, isSuccessResponse } from 'hola-web';
import { register_types } from './core/type';
import 'hola-web/style.css';

// Import hola-web locale messages
import holaEnMessages from 'hola-web/locales/en.json';

// Register custom types before app initialization
register_types();

// Views - Public
import LoginView from './views/LoginView.vue';
import ProductListView from './views/ProductListView.vue';
import ProductDetailView from './views/ProductDetailView.vue';
import CartView from './views/CartView.vue';
import MyOrdersView from './views/MyOrdersView.vue';

// Views - Admin
import DashboardView from './views/DashboardView.vue';
import CategoryManageView from './views/CategoryManageView.vue';
import ProductManageView from './views/ProductManageView.vue';
import OrderManageView from './views/OrderManageView.vue';
import CustomerManageView from './views/CustomerManageView.vue';

// Components
import BreadCrumbs from './components/BreadCrumbs.vue';

// Router setup
// Load app locale files eagerly
const localeModules = import.meta.glob('./locales/*.json', { eager: true }) as Record<
  string,
  { default: Record<string, unknown> }
>;
const appMessages = loadLocaleMessagesEager(localeModules);

// Merge hola-web messages with app messages (deep merge so nested keys like type.* are preserved)
const messages = {
  en: deepMerge(holaEnMessages as Record<string, unknown>, (appMessages.en || {}) as Record<string, unknown>),
};

// Auth state (declared early for axios interceptor)
let userRole: string | null = null;
let authChecked = false;

// Router reference (set after creation for axios interceptor)
let router: ReturnType<typeof createRouter>;

// Configure Axios with backend API base URL
const axiosInstance = initAxios({ baseURL: 'http://localhost:3003' });

// Define routes
const routes = [
  // Auth
  { path: '/login', name: 'login', component: LoginView, meta: { login: true, public: true } },

  // Public/User routes
  { path: '/', redirect: '/products' },
  { path: '/products', name: 'products', component: ProductListView, meta: { public: true } },
  { path: '/product/:id', name: 'product-detail', component: ProductDetailView, meta: { public: true } },
  { path: '/cart', name: 'cart', component: CartView, meta: { public: true } },
  { path: '/my-orders', name: 'my-orders', component: MyOrdersView },

  // Admin routes
  { path: '/admin/dashboard', name: 'dashboard', component: DashboardView, meta: { admin: true } },
  { path: '/admin/categories', name: 'admin-categories', component: CategoryManageView, meta: { admin: true } },
  { path: '/admin/products', name: 'admin-products', component: ProductManageView, meta: { admin: true } },
  { path: '/admin/orders', name: 'admin-orders', component: OrderManageView, meta: { admin: true } },
  { path: '/admin/customers', name: 'admin-customers', component: CustomerManageView, meta: { admin: true } },
];

// Menu generator function - called by NavBar
export const getMenus = (t: (key: string) => string, role: string | null) => {
  const menus = [];

  // Shop menus (always visible)
  menus.push({
    title: t('menu.shop'),
    menus: [
      { icon: 'mdi-shopping', title: t('menu.products'), route: '/products' },
      { icon: 'mdi-cart', title: t('menu.cart'), route: '/cart' },
    ],
  });

  // User menus (logged in users)
  if (role) {
    menus.push({
      title: t('menu.my_account'),
      menus: [
        { icon: 'mdi-package-variant', title: t('menu.my_orders'), route: '/my-orders' },
      ],
    });
  }

  // Admin menus
  if (role === 'admin') {
    menus.push({
      title: t('menu.admin'),
      menus: [
        { icon: 'mdi-view-dashboard', title: t('menu.dashboard'), route: '/admin/dashboard' },
        { icon: 'mdi-folder', title: t('menu.manage_categories'), route: '/admin/categories' },
        { icon: 'mdi-package-variant', title: t('menu.manage_products'), route: '/admin/products' },
        { icon: 'mdi-clipboard-list', title: t('menu.manage_orders'), route: '/admin/orders' },
        { icon: 'mdi-account-group', title: t('menu.manage_customers'), route: '/admin/customers' },
      ],
    });
  }

  return menus;
};

// Create Vue app
const app = createApp(App);

// Setup Router
router = createRouter({
  history: createWebHistory(),
  routes,
});

// Add axios interceptor to redirect to login on HTTP 401 errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Reset auth state and redirect to login
      userRole = null;
      authChecked = false;
      router.push({ name: 'login' });
    }
    return Promise.reject(error);
  }
);

// Role response type
interface RoleResponse {
  code: number;
  role: string | null;
}

// Check authentication
const checkAuth = async (): Promise<boolean> => {
  try {
    const response = await axiosGet<RoleResponse>('/customer/role');
    if (isSuccessResponse(response.code) && response.role !== undefined) {
      userRole = response.role;
      authChecked = true;
      return true;
    }
    userRole = null;
    authChecked = true;
    return false;
  } catch {
    userRole = null;
    authChecked = true;
    return false;
  }
};

// Reset auth state (call on logout)
export const resetAuthState = () => {
  userRole = null;
  authChecked = false;
};

// Set auth state (call on login)
export const setAuthState = (role: string | null) => {
  userRole = role;
  authChecked = true;
};

// Get current user role
export const getCurrentRole = () => userRole;

// Navigation guard
router.beforeEach(async (to: RouteLocationNormalized, _from: RouteLocationNormalized) => {
  // Always allow public routes
  if (to.meta.public) {
    return true;
  }

  // Check authentication if not already done
  if (!authChecked) {
    await checkAuth();
  }

  // Redirect to login if not authenticated
  if (userRole === null) {
    return { name: 'login' };
  }

  // Check admin access
  if (to.meta.admin && userRole !== 'admin') {
    return { name: 'products' };
  }

  return true;
});

app.use(router);

// Setup Pinia store
const pinia = createPinia();
app.use(pinia);

// Initialize hola-web with all plugins
initApp(app, {
  localeMessages: messages,
  locale: 'en',
  theme: {
    light: {
      primary: '#1976D2',
      secondary: '#424242',
      accent: '#82B1FF',
      error: '#FF5252',
      info: '#2196F3',
      success: '#4CAF50',
      warning: '#FB8C00',
      bgcolor: '#F5F5F5',
      appBar: '#FFFFFF',
      toolbarIcon: '#424242',
      card: '#FFFFFF',
      tableHeader: '#F5F5F5',
      create: '#1976D2',
      edit: '#0288D1',
      clone: '#0097A7',
      delete: '#E53935',
      refresh: '#43A047',
      chart: '#1E88E5',
    }
  }
});

// Install hola-web components (h-crud, h-navbar, etc.)
installComponents(app);

// Register custom components
app.component('h-bread', BreadCrumbs);

// Mount the app
app.mount('#app');
