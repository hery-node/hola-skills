# Lesson 3: Views Showcase - E-Commerce Demo

## 🎯 Learning Objectives

By completing this lesson, you will:

1. ✅ Understand how to use all major hola-web components
2. ✅ Build a complete E-Commerce application with role-based access
3. ✅ Implement shopping cart functionality with Vue composables
4. ✅ Create admin dashboards with statistics and charts
5. ✅ Handle order workflow with status management
6. ✅ Integrate product reviews and ratings

**Difficulty:** Intermediate to Advanced  
**Estimated Time:** 60-90 minutes  
**Prerequisites:** Complete [Lesson 0](../lesson_0_startup/README.md) and [Lesson 1](../lesson_1_user_role/README.md)

---

## 📚 What You'll Build

A full **E-Commerce Platform** with:

### Customer Features

- 🛒 Browse products with grid/list view
- 🔍 Filter by category and search
- 📦 Product details with reviews
- 🛍️ Shopping cart (localStorage)
- 📝 Place orders
- 📋 View order history
- ⭐ Write product reviews

### Admin Features

- 📊 Dashboard with KPI statistics
- 📈 Sales charts (Bar, Line, Pie)
- 📁 Category management (CRUD)
- 📦 Product management with publish workflow
- 📋 Order management with status updates
- 👥 Customer management

---

## 🏗️ Project Structure

```
lesson_3_views/
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── main.ts              # Entry point with seed data
│       ├── setting.ts           # Server configuration (port 3003)
│       ├── core/
│       │   └── type.ts          # Custom types (status enums)
│       └── router/
│           ├── category.ts      # Category CRUD
│           ├── product.ts       # Product CRUD + publish actions
│           ├── customer.ts      # Customer CRUD + auth
│           ├── order.ts         # Order CRUD + workflow
│           ├── review.ts        # Product reviews
│           └── dashboard.ts     # Statistics APIs
│
└── web/
    ├── index.html
    ├── package.json
    ├── vite.config.ts           # Vite config (port 8083)
    ├── tsconfig.json
    └── src/
        ├── App.vue              # Root component
        ├── main.ts              # Vue entry + routes
        ├── core/
        │   └── type.ts          # Client-side types
        ├── composables/
        │   └── useCart.ts       # Shopping cart composable
        ├── components/
        │   └── NavBar.vue       # Custom nav with cart badge
        ├── locales/
        │   └── en.json          # i18n messages
        └── views/
            ├── LoginView.vue          # Login/Register
            ├── ProductListView.vue    # Product browsing
            ├── ProductDetailView.vue  # Product details + reviews
            ├── CartView.vue           # Shopping cart
            ├── MyOrdersView.vue       # User's orders
            ├── DashboardView.vue      # Admin dashboard
            ├── CategoryManageView.vue # Admin category CRUD
            ├── ProductManageView.vue  # Admin product CRUD
            ├── OrderManageView.vue    # Admin order management
            └── CustomerManageView.vue # Admin customer CRUD
```

---

## 🚀 Quick Start

### Option 1: Docker

```bash
# From hola-meta root
docker-compose up lesson3-server lesson3-web mongodb

# Access at: http://localhost:8083
```

### Option 2: Manual Setup

```bash
# Terminal 1: Start server
cd lesson_3_views/server
bun install
bun run dev

# Terminal 2: Start web
cd lesson_3_views/web
bun install
bun run dev

# Access at: http://localhost:8083
```

### Default Login Credentials

| Role  | Email          | Password |
| ----- | -------------- | -------- |
| Admin | admin@demo.com | admin123 |
| User  | john@demo.com  | user123  |

---

## 📊 Components Showcased

### Core CRUD Components

| Component  | Used In                                                                    | Purpose              |
| ---------- | -------------------------------------------------------------------------- | -------------------- |
| `h-crud`   | CategoryManageView, ProductManageView, OrderManageView, CustomerManageView | Full CRUD operations |
| `h-table`  | (embedded in h-crud)                                                       | Data tables          |
| `h-form`   | (embedded in h-crud)                                                       | Entity forms         |
| `h-navbar` | NavBar.vue                                                                 | Navigation           |

### Chart Components

| Component        | Used In                     | Purpose                             |
| ---------------- | --------------------------- | ----------------------------------- |
| `ChartBarView`   | DashboardView               | Sales by month                      |
| `ChartLineView`  | DashboardView               | Order trends                        |
| `ChartPieView`   | DashboardView               | Orders by status, Sales by category |
| `StatisticsView` | DashboardView, MyOrdersView | KPI cards                           |

### Other Components

| Component      | Used In           | Purpose       |
| -------------- | ----------------- | ------------- |
| `v-rating`     | ProductDetailView | Star ratings  |
| `v-card`       | ProductListView   | Product cards |
| `v-data-table` | MyOrdersView      | Order history |
| `v-dialog`     | Multiple views    | Modal dialogs |

---

## 🔐 Role-Based Access Control

### Public Routes (No Auth Required)

- `/products` - Browse products
- `/product/:id` - Product details
- `/cart` - Shopping cart
- `/login` - Login/Register

### User Routes (Auth Required)

- `/my-orders` - View own orders

### Admin Routes (Admin Role Only)

- `/admin/dashboard` - Statistics dashboard
- `/admin/categories` - Category management
- `/admin/products` - Product management
- `/admin/orders` - Order management
- `/admin/customers` - Customer management

---

## 🛒 Shopping Cart Implementation

The shopping cart uses a Vue composable (`useCart.ts`) with localStorage:

```typescript
// composables/useCart.ts
export function useCart() {
  const cartItems = ref<CartItem[]>(loadCart());

  const addToCart = (product: Product, quantity = 1) => { ... };
  const removeFromCart = (productId: string) => { ... };
  const updateQuantity = (productId: string, quantity: number) => { ... };
  const clearCart = () => { ... };

  return { cartItems, itemCount, totalAmount, ... };
}
```

---

## 📦 Order Workflow

```
┌─────────┐     ┌──────┐     ┌─────────┐     ┌───────────┐
│ PENDING │ ──► │ PAID │ ──► │ SHIPPED │ ──► │ DELIVERED │
└─────────┘     └──────┘     └─────────┘     └───────────┘
     │
     └──────────────────────────────────────► ┌───────────┐
                                              │ CANCELLED │
                                              └───────────┘
```

- **PENDING** → Customer can cancel
- **PAID** → Admin marked as paid
- **SHIPPED** → Admin marked as shipped (auto-sets shippedAt)
- **DELIVERED** → Admin marked as delivered (auto-sets deliveredAt)
- **CANCELLED** → Order cancelled (by customer or admin)

---

## 📈 Dashboard Statistics APIs

| Endpoint                       | Returns                     | Chart Type           |
| ------------------------------ | --------------------------- | -------------------- |
| `/dashboard/stats`             | KPI totals                  | StatisticsView cards |
| `/dashboard/sales-by-month`    | Monthly sales               | Bar chart            |
| `/dashboard/orders-by-status`  | Order status distribution   | Pie chart            |
| `/dashboard/sales-by-category` | Sales per category          | Rose chart           |
| `/dashboard/order-trend`       | Last 30 days orders/revenue | Line chart           |

---

## 🎨 Key Patterns Demonstrated

### 1. Custom Actions in h-crud

```vue
<h-crud
  :actions="[
    {
      icon: 'mdi-publish',
      tooltip: 'Publish',
      handle: (item) => publishProduct(item._id),
      shown: (item) => item.status === PRODUCT_STATUS.DRAFT,
    },
  ]"
/>
```

### 2. Custom Headers with Formatting

```vue
<h-crud
  :headers="[
    {
      name: 'status',
      chip: true,
      format: (value) => STATUS_LABELS[value],
      style: (value) => STATUS_COLORS[value],
    },
  ]"
/>
```

### 3. Vue Composables for Shared State

```typescript
// Shared cart state across components
const { cartItems, addToCart, totalAmount } = useCart();
```

### 4. Role-Based Menu Generation

```typescript
export const getMenus = (t, role) => {
  const menus = [
    /* public menus */
  ];
  if (role === "admin") {
    menus.push({
      title: "Admin",
      menus: [
        /* admin menus */
      ],
    });
  }
  return menus;
};
```

---

## 🔧 Customization Ideas

1. **Add Product Images Upload** - Use GridFS integration
2. **Add Shipping Address** - Extend order form
3. **Add Payment Integration** - Connect to Stripe/PayPal
4. **Add Email Notifications** - Order confirmation emails
5. **Add Inventory Tracking** - Auto-update stock on order
6. **Add Product Variants** - Size, color options
7. **Add Wishlist** - Save products for later

---

## 🐛 Troubleshooting

### Server won't start

- Ensure MongoDB is running: `mongod`
- Check port 3003 is available

### Web won't start

- Ensure hola-web is built: `cd hola-web && npm run build`
- Check port 8083 is available

### Charts not showing

- Place some orders first to generate data
- Check browser console for errors

### Login not working

- Server must be running and seeded
- Check network tab for API errors

---

## 📚 Related Lessons

- [Lesson 0: Startup Basics](../lesson_0_startup/README.md) - Basic CRUD
- [Lesson 1: User & Role Management](../lesson_1_user_role/README.md) - Authentication

---

## 📝 License

MIT License - See [LICENSE](../../LICENSE) for details.
