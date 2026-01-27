# Stage 4: Client Implementation

## Objective

Build web client UI with maximum code reuse:

- **DEFAULT: Use h-crud component** (handles 90% of use cases)
- Configure h-crud modes, views, and props
- **CREATE CUSTOM VIEWS** only when h-crud is insufficient
- Use Vue 3 + Vuetify 3 for custom components

## Core Principle: h-crud First

The `h-crud` component is **metadata-driven** and automatically:

- Fetches entity metadata from server
- Generates forms (create, edit, search)
- Renders data tables with sorting/pagination
- Handles all CRUD operations
- Manages loading states and errors
- Applies role-based access control
- **Uses i18n for all labels and messages** (no hardcoded text)

**Use h-crud unless** you need:

- Custom layouts beyond table + forms
- Complex multi-step workflows
- Special visualizations (charts, maps, etc.)
- Non-standard interactions

## Basic h-crud Setup

### Minimal Configuration

```vue
<!-- web/src/views/ProductView.vue -->
<template>
  <h-crud entity="product" mode="cruds" :sortKey="['createdAt']" :sortDesc="[true]" itemLabelKey="name" />
</template>

<script setup>
// No additional code needed!
</script>
```

**That's it!** This gives you:

- Create button + form
- Read (table view)
- Update (edit button + form)
- Delete (delete button + confirmation)
- Search form
- Infinite scroll (preferred for better UX)

### h-crud Props Reference

| Prop           | Type   | Required | Description                                      |
| -------------- | ------ | -------- | ------------------------------------------------ |
| `entity`       | String | ✓        | Entity name (matches server collection)          |
| `mode`         | String | ✓        | Operation modes (see below)                      |
| `sortKey`      | Array  | ✓        | Field names for sorting                          |
| `sortDesc`     | Array  | ✓        | Sort directions (true = desc)                    |
| `itemLabelKey` | String | ✓        | Field to show in delete confirmation             |
| `headers`      | Array  |          | Custom table headers (auto-generated if omitted) |
| `editFields`   | Array  |          | Custom form fields (auto-generated if omitted)   |
| `searchFields` | Array  |          | Custom search fields (auto-generated if omitted) |
| `createView`   | String |          | View name for create form (default: "\*")        |
| `updateView`   | String |          | View name for update form (default: "\*")        |
| `actions`      | Array  |          | Additional row actions                           |
| `toolbars`     | Array  |          | Additional toolbar buttons                       |

### Mode String

The `mode` prop is a string of characters, each enabling a feature:

| Char | Feature    | Description                                              |
| ---- | ---------- | -------------------------------------------------------- |
| `c`  | Create     | Show create button + form                                |
| `r`  | Refresh    | Show refresh button                                      |
| `u`  | Update     | Show edit button + form                                  |
| `d`  | Delete     | Show delete button                                       |
| `s`  | Search     | Show search form                                         |
| `o`  | Clone      | Show clone button                                        |
| `b`  | Batch      | Enable batch operations                                  |
| `p`  | Pagination | Use pagination (**default: infinite scroll, preferred**) |

**Common mode combinations**:

- `"cruds"` - Full CRUD with search (infinite scroll - **recommended**)
- `"crud"` - Basic CRUD without search (infinite scroll)
- `"rs"` - Read-only with search (infinite scroll)
- `"crudsob"` - Full featured with clone and batch (infinite scroll)
- `"crudsp"` - Full CRUD with search and pagination (only if needed)

**Note**: Infinite scroll is preferred for better UX. Only use `p` (pagination) for very large datasets or specific requirements.

## i18n (Internationalization)

### Core Principle: Never Hardcode Text

**All user-facing text must use i18n** to support multiple languages and maintain consistency.

### Built-in i18n Support

Hola-web includes pre-defined locale messages for:

- Form labels and buttons (`form.*`)
- Table headers and actions (`table.*`)
- Type validation (`type.*`)
- Confirmation dialogs (`confirm.*`)

### Setting Up i18n

```typescript
// web/src/main.ts
import { createApp } from "vue";
import { initApp, loadLocaleMessagesEager, deepMerge } from "hola-web";
import holaEnMessages from "hola-web/locales/en.json";
import holaZhMessages from "hola-web/locales/zh.json";
import App from "./App.vue";
import router from "./router";

const app = createApp(App);

// Load your app's locale files
const appLocales = import.meta.glob("./locales/*.json", { eager: true }) as Record<string, { default: Record<string, unknown> }>;
const appMessages = loadLocaleMessagesEager(appLocales);

// Deep merge hola-web messages with your app messages
const mergedMessages = {
  en: deepMerge(holaEnMessages as Record<string, unknown>, (appMessages.en || {}) as Record<string, unknown>),
  zh: deepMerge(holaZhMessages as Record<string, unknown>, (appMessages.zh || {}) as Record<string, unknown>),
};

// Initialize app with i18n
initApp(app, {
  router,
  localeMessages: mergedMessages,
  locale: localStorage.getItem("locale") || "en",
});

app.mount("#app");
```

### Entity-Specific Labels

Define entity field labels in locale files:

```json
// web/src/locales/en.json
{
  "product": {
    "_label": "Product",
    "sku": "SKU",
    "sku_hint": "Unique product identifier",
    "name": "Product Name",
    "name_hint": "Enter the product name",
    "description": "Description",
    "price": "Price",
    "price_hint": "Enter price in USD",
    "stock": "Stock",
    "category": "Category",
    "categoryName": "Category Name"
  },
  "order": {
    "_label": "Order",
    "orderNo": "Order Number",
    "customer": "Customer",
    "total": "Total Amount",
    "status": "Status"
  }
}
```

### Using i18n in Templates

```vue
<template>
  <!-- ❌ Wrong: Hardcoded text -->
  <v-btn>Create Product</v-btn>

  <!-- ✅ Correct: Use i18n -->
  <v-btn>{{ $t("form.create_title", { entity: $t("product._label") }) }}</v-btn>

  <!-- Field labels -->
  <v-text-field :label="$t('product.name')" :hint="$t('product.name_hint')" />
</template>
```

### Using i18n in Composition API

```vue
<script setup>
import { useI18n } from "vue-i18n";

const { t } = useI18n();

// ❌ Wrong: Hardcoded
const title = "Product Management";

// ✅ Correct: Use i18n
const title = t("product._label");
const createLabel = t("form.create_title", { entity: t("product._label") });
</script>
```

### Language Switching

```vue
<template>
  <v-select v-model="currentLocale" :items="languages" @update:model-value="switchLanguage" />
</template>

<script setup>
import { useI18n } from "vue-i18n";

const { locale } = useI18n();

const languages = [
  { value: "en", title: "English" },
  { value: "zh", title: "中文" },
];

const currentLocale = computed({
  get: () => locale.value,
  set: (val) => {
    locale.value = val;
    localStorage.setItem("locale", val);
  },
});
</script>
```

### Complete Locale File Example

```json
// web/src/locales/en.json
{
  "product": {
    "_label": "Product",
    "sku": "SKU",
    "sku_hint": "Unique product identifier",
    "name": "Product Name",
    "name_hint": "Enter the product name",
    "description": "Description",
    "price": "Price",
    "price_min": "Min Price",
    "price_max": "Max Price",
    "price_hint": "Enter price in USD",
    "stock": "Stock",
    "category": "Category",
    "categoryName": "Category Name",
    "view_details": "View Details",
    "view_analytics": "View Analytics",
    "export_csv": "Export CSV"
  },
  "order": {
    "_label": "Order",
    "orderNo": "Order Number",
    "customer": "Customer",
    "total": "Total Amount",
    "status": "Status"
  },
  "nav": {
    "dashboard": "Dashboard",
    "products": "Products",
    "orders": "Orders"
  },
  "dashboard": {
    "total_orders": "Total Orders",
    "revenue": "Revenue",
    "top_products": "Top Products"
  },
  "checkout": {
    "add_to_cart": "Add to Cart"
  },
  "event": {
    "register": "Register",
    "cancel": "Cancel Registration"
  }
}
```

### Example: Full-Featured Table with i18n

```vue
<template>
  <h-crud entity="product" mode="crudsopb" :sortKey="['category', 'name']" :sortDesc="[false, false]" itemLabelKey="name" createView="default" updateView="admin" :actions="customActions" />
</template>

<script setup>
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const customActions = [
  {
    icon: "mdi-eye",
    label: t("product.view_details"), // ✅ Use i18n
    click: (item) => {
      console.log("View", item);
    },
  },
];
</script>
```

## Customizing h-crud

### Custom Table Headers

When auto-generated headers aren't sufficient:

```vue
<template>
  <h-crud entity="product" mode="crudsp" :sortKey="['name']" :sortDesc="[false]" itemLabelKey="name" :headers="customHeaders" />
</template>

<script setup>
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const customHeaders = [
  { text: t("product.sku"), value: "sku", sortable: true },
  { text: t("product.name"), value: "name", sortable: true },
  { text: t("product.price"), value: "price", sortable: true, format: (v) => `$${v.toFixed(2)}` },
  { text: t("product.stock"), value: "stock", sortable: true },
  { text: t("product.category"), value: "categoryName", sortable: false },
  { text: t("table.action_header"), value: "actions", sortable: false },
];
</script>
```

### Custom Form Fields

When you need specific field configurations:

```vue
<template>
  <h-crud entity="product" mode="crud" :sortKey="['name']" :sortDesc="[false]" itemLabelKey="name" :editFields="customEditFields" />
</template>

<script setup>
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const customEditFields = [
  {
    name: "sku",
    label: t("product.sku"),
    input_type: "text",
    required: true,
    hint: t("product.sku_hint"),
  },
  {
    name: "name",
    label: t("product.name"),
    input_type: "text",
    required: true,
  },
  {
    name: "description",
    label: t("product.description"),
    input_type: "textarea",
    rows: 5,
  },
  {
    name: "price",
    label: t("product.price"),
    input_type: "number",
    required: true,
    min: 0,
    step: 0.01,
    hint: t("product.price_hint"),
  },
  {
    name: "category",
    label: t("product.category"),
    input_type: "autocomplete",
    items: [], // Will be populated from metadata
    required: true,
  },
];
</script>
```

### Custom Search Fields

```vue
<template>
  <h-crud entity="product" mode="crudsp" :sortKey="['name']" :sortDesc="[false]" itemLabelKey="name" :searchFields="customSearchFields" />
</template>

<script setup>
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const customSearchFields = [
  {
    name: "name",
    label: t("product.name"),
    search_input_type: "text",
  },
  {
    name: "category",
    label: t("product.category"),
    search_input_type: "autocomplete",
    items: [],
  },
  {
    name: "priceMin",
    label: t("product.price_min"),
    search_input_type: "number",
  },
  {
    name: "priceMax",
    label: t("product.price_max"),
    search_input_type: "number",
  },
];
</script>
```

## When h-crud is Not Enough

### Scenario 1: Dashboard/Analytics

When you need charts, statistics, or custom layouts:

```vue
<!-- web/src/views/DashboardView.vue -->
<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="3">
        <v-card>
          <v-card-title>{{ $t("dashboard.total_orders") }}</v-card-title>
          <v-card-text class="text-h4">{{ stats.totalOrders }}</v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="3">
        <v-card>
          <v-card-title>{{ $t("dashboard.revenue") }}</v-card-title>
          <v-card-text class="text-h4">${{ stats.revenue.toFixed(2) }}</v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title>{{ $t("dashboard.recent_orders") }}</v-card-title>
          <v-card-text>
            <!-- Use h-crud inside custom layout -->
            <h-crud entity="order" mode="rs" :sortKey="['createdAt']" :sortDesc="[true]" itemLabelKey="orderNo" />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { api } from "@/core/api";

const stats = ref({ totalOrders: 0, revenue: 0 });

onMounted(async () => {
  const response = await api.get("/dashboard/stats");
  stats.value = response.data;
});
</script>
```

### Scenario 2: Multi-Step Workflow

When CRUD operations have multiple steps:

```vue
<!-- web/src/views/OrderCheckoutView.vue -->
<template>
  <v-stepper v-model="step">
    <v-stepper-header>
      <v-stepper-item :value="1" :title="$t('checkout.cart')"></v-stepper-item>
      <v-stepper-item :value="2" :title="$t('checkout.shipping')"></v-stepper-item>
      <v-stepper-item :value="3" :title="$t('checkout.payment')"></v-stepper-item>
      <v-stepper-item :value="4" :title="$t('checkout.confirmation')"></v-stepper-item>
    </v-stepper-header>

    <v-stepper-window>
      <v-stepper-window-item :value="1">
        <CartStep @next="step++" />
      </v-stepper-window-item>

      <v-stepper-window-item :value="2">
        <ShippingStep @next="step++" @back="step--" />
      </v-stepper-window-item>

      <v-stepper-window-item :value="3">
        <PaymentStep @next="completeOrder" @back="step--" />
      </v-stepper-window-item>

      <v-stepper-window-item :value="4">
        <ConfirmationStep :order="completedOrder" />
      </v-stepper-window-item>
    </v-stepper-window>
  </v-stepper>
</template>

<script setup>
import { ref } from "vue";
import { api } from "@/core/api";

const step = ref(1);
const completedOrder = ref(null);

const completeOrder = async (orderData) => {
  const response = await api.post("/order", orderData);
  completedOrder.value = response.data;
  step.value = 4;
};
</script>
```

### Scenario 3: Custom Visualizations

When you need maps, calendars, or other specialized views:

```vue
<!-- web/src/views/EventCalendarView.vue -->
<template>
  <v-container>
    <v-row>
      <v-col cols="12" md="8">
        <v-calendar v-model="selectedDate" :events="events" @click:event="showEventDetails" />
      </v-col>

      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>{{ $t("event._label") }}</v-card-title>
          <v-card-text>
            <!-- Still use h-crud for list management -->
            <h-crud entity="event" mode="crud" :sortKey="['startDate']" :sortDesc="[false]" itemLabelKey="title" />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { api } from "@/core/api";

const selectedDate = ref(new Date());
const events = ref([]);

onMounted(async () => {
  const response = await api.get("/event");
  events.value = response.data.map((e) => ({
    title: e.title,
    start: new Date(e.startDate),
    end: new Date(e.endDate),
  }));
});
</script>
```

## Router Setup

### Basic Route Configuration

```typescript
// web/src/router/index.ts
import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("@/views/HomeView.vue"),
    },
    {
      path: "/products",
      name: "products",
      component: () => import("@/views/ProductView.vue"),
    },
    {
      path: "/orders",
      name: "orders",
      component: () => import("@/views/OrderView.vue"),
    },
    {
      path: "/dashboard",
      name: "dashboard",
      component: () => import("@/views/DashboardView.vue"),
      meta: { requiresAuth: true, role: "admin" },
    },
  ],
});

// Navigation guard for authentication
router.beforeEach((to, from, next) => {
  const user = sessionStorage.getItem("user");

  if (to.meta.requiresAuth && !user) {
    next({ name: "login" });
  } else {
    next();
  }
});

export default router;
```

### Navigation Menu

```vue
<!-- web/src/components/AppNav.vue -->
<template>
  <v-navigation-drawer>
    <v-list>
      <v-list-item to="/" prepend-icon="mdi-home" :title="$t('nav.home')" />
      <v-list-item to="/products" prepend-icon="mdi-package-variant" :title="$t('product._label')" />
      <v-list-item to="/orders" prepend-icon="mdi-cart" :title="$t('order._label')" />

      <v-divider v-if="isAdmin" />

      <template v-if="isAdmin">
        <v-list-item to="/dashboard" prepend-icon="mdi-view-dashboard" :title="$t('nav.dashboard')" />
        <v-list-item to="/users" prepend-icon="mdi-account-group" :title="$t('user._label')" />
      </template>
    </v-list>
  </v-navigation-drawer>
</template>

<script setup>
import { computed } from "vue";

const user = computed(() => {
  const stored = sessionStorage.getItem("user");
  return stored ? JSON.parse(stored) : null;
});

const isAdmin = computed(() => user.value?.role === "admin");
</script>
```

## API Integration

### Using hola-web API Helper

```typescript
// web/src/core/api.ts (built-in)
import { api } from "@/core/api";

// GET request
const products = await api.get("/product");

// POST request
const newProduct = await api.post("/product", {
  sku: "ABC123",
  name: "Product Name",
  price: 99.99,
});

// PUT request
const updated = await api.put(`/product/${id}`, {
  price: 89.99,
});

// DELETE request
await api.delete(`/product/${id}`);
```

### Custom Composable for Data Fetching

```typescript
// web/src/composables/useEntity.ts
import { ref } from "vue";
import { api } from "@/core/api";

export function useEntity(entityName: string) {
  const items = ref([]);
  const loading = ref(false);
  const error = ref(null);

  const fetchAll = async () => {
    loading.value = true;
    try {
      const response = await api.get(`/${entityName}`);
      items.value = response.data;
    } catch (e) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  };

  const create = async (data) => {
    const response = await api.post(`/${entityName}`, data);
    items.value.push(response.data);
    return response.data;
  };

  const update = async (id, data) => {
    const response = await api.put(`/${entityName}/${id}`, data);
    const index = items.value.findIndex((item) => item._id === id);
    if (index !== -1) {
      items.value[index] = response.data;
    }
    return response.data;
  };

  const remove = async (id) => {
    await api.delete(`/${entityName}/${id}`);
    items.value = items.value.filter((item) => item._id !== id);
  };

  return {
    items,
    loading,
    error,
    fetchAll,
    create,
    update,
    remove,
  };
}
```

**Usage**:

```vue
<script setup>
import { onMounted } from "vue";
import { useEntity } from "@/composables/useEntity";

const { items, loading, fetchAll } = useEntity("product");

onMounted(() => {
  fetchAll();
});
</script>
```

## Complete Example: Product Management

```vue
<!-- web/src/views/ProductView.vue -->
<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <h1>{{ $t("product.management_title") }}</h1>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12">
        <h-crud entity="product" mode="crudsopb" :sortKey="['category', 'name']" :sortDesc="[false, false]" itemLabelKey="name" createView="default" :actions="customActions" :toolbars="customToolbars" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

const { t } = useI18n();

const customActions = [
  {
    icon: "mdi-chart-line",
    label: t("product.view_analytics"),
    click: (item) => {
      router.push(`/products/${item._id}/analytics`);
    },
  },
];

const customToolbars = [
  {
    icon: "mdi-file-export",
    label: t("product.export_csv"),
    click: async () => {
      // Custom export logic
      window.location.href = "/api/product/export?format=csv";
    },
  },
];
</script>
```

## Checklist

Before proceeding to Stage 5:

- [ ] All entity views created (use h-crud by default)
- [ ] Custom views created only where necessary
- [ ] **i18n properly configured and used** (no hardcoded text)
- [ ] **All locale files created** for entity labels and messages
- [ ] Router configured with all routes
- [ ] Navigation menu implemented (with i18n)
- [ ] Authentication/authorization integrated
- [ ] API integration working
- [ ] Language switching implemented (if multi-language support needed)

## Next Step

Proceed to **[05-integration.md](05-integration.md)** to wire everything together and write tests.
