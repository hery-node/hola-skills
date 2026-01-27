# Lesson 3: Views Showcase - Design Document

## Overview

This lesson demonstrates a full-featured E-Commerce application showcasing all hola-web view components with role-based access control.

## Architecture

### Server (Port 3003)

- **Framework**: Elysia with hola-server utilities
- **Database**: MongoDB (lesson3_views)
- **Authentication**: Session-based with role support

### Web Client (Port 8083)

- **Framework**: Vue 3 + Vuetify 3
- **State Management**: Composables (useCart)
- **Components**: hola-web component library

---

## Entities

| Entity   | Collection | Primary Key      | Ref Label | Description                   |
| -------- | ---------- | ---------------- | --------- | ----------------------------- |
| Category | category   | name             | name      | Product categories            |
| Product  | product    | name             | name      | Products with status workflow |
| Customer | customer   | email            | name      | Users with role-based access  |
| Order    | order      | orderNo          | orderNo   | Orders with status workflow   |
| Review   | review     | product,customer | comment   | Product reviews/ratings       |

---

## Lessons Learned

### 1. hola-server API Methods

#### Entity Methods

```typescript
// ✅ Correct methods
entity.find_by_oid(id); // Find single document by ObjectId
entity.find_one(query); // Find single document by query
entity.find(query); // Find multiple documents
entity.find_sort(query, sort); // Find with sorting
entity.update(query, data); // Update documents matching query
entity.create(data); // Create new document
entity.count(query); // Count documents

// ❌ Non-existent methods (common mistakes)
entity.find_by_id(id); // Use find_by_oid instead
entity.update_by_id(id, data); // Use update(oid_query(id), data) instead
```

#### Using oid_query for Updates

```typescript
import { oid_query } from "hola-server";

// Update by ObjectId
const query = oid_query(id);
if (query) {
  await entity.update(query, { status: "active" });
}
```

### 2. HTTP Status Codes

Available codes in `hola-server/http/code.ts`:

```typescript
export const ERROR = 0;
export const SUCCESS = 1;
export const NO_SESSION = 200;
export const NO_RIGHTS = 201; // Use instead of FORBIDDEN
export const NO_PARAMS = 202;
export const NOT_FOUND = 203;
export const INVALID_PARAMS = 204;
export const DUPLICATE_KEY = 300; // Use instead of ALREADY_EXISTS
```

### 3. Callback Function Typing and Argument Order

The `CallbackFunction` type is `(...args: unknown[]) => unknown`. Use type assertions inside callbacks.

**CRITICAL: Argument order varies by hook type:**

| Hook           | args[0] | args[1]   | args[2] |
| -------------- | ------- | --------- | ------- |
| before_create  | entity  | data      | -       |
| after_create   | entity  | data      | -       |
| before_update  | \_id    | entity    | data    |
| after_update   | \_id    | entity    | data    |
| before_delete  | entity  | id_array  | -       |
| after_delete   | entity  | id_array  | -       |
| before_clone   | \_id    | entity    | data    |
| after_clone    | \_id    | entity    | data    |
| **list_query** | entity  | param_obj | req     |

```typescript
// ✅ Correct pattern - note the different argument positions!
before_create: async (...args: unknown[]) => {
  const entity = args[0]; // Entity instance (not used often)
  const data = args[1] as Record<string, unknown>;
  data.orderNo = generateOrderNo();
},

after_update: async (...args: unknown[]) => {
  const _id = args[0] as string;
  const entity = args[1]; // Entity instance
  const data = args[2] as Record<string, unknown>;
  // ... logic
},

list_query: (...args: unknown[]) => {
  const entity = args[0]; // Entity instance - DO NOT return this!
  const param_obj = args[1]; // Request parameters
  const req = args[2] as Request; // Elysia request

  // Return a NEW query object, don't mutate entity!
  const isAdmin = (req.session as any)?.user?.role === 'admin';
  if (!isAdmin) {
    return { status: PRODUCT_STATUS.PUBLISHED };
  }
  return {};
},

// ❌ WRONG - args[0] is entity, not query! This causes circular BSON error
list_query: (...args: unknown[]) => {
  const query = args[0] as Record<string, unknown>; // WRONG! This is Entity
  query.status = PRODUCT_STATUS.PUBLISHED; // Mutating Entity causes circular ref!
  return query;
},

// ❌ Incorrect - explicit parameter types cause TS errors
before_create: async (data: Record<string, unknown>) => { ... }
```

### 4. list_query Must Return New Object (CRITICAL)

The `list_query` hook receives `(entity, param_obj, req)` and must return a **new plain query object**.

**Common mistake:** Treating `args[0]` as a query object to mutate. This is actually the `Entity` instance which has circular references, causing `BSONError: Cannot convert circular structure to BSON`.

```typescript
// ✅ Correct - return a new query object
list_query: (...args: unknown[]) => {
  const req = args[2] as Request;
  const isAdmin = (req.session as any)?.user?.role === 'admin';
  if (!isAdmin && (req.session as any)?.user?.id) {
    return { customer: (req.session as any).user.id }; // New object
  }
  return {}; // Empty object, not args[0]!
},

// ❌ WRONG - mutating args[0] (Entity) causes BSON circular reference error
list_query: (...args: unknown[]) => {
  const query = args[0] as Record<string, unknown>;
  query.customer = req.session.user.id; // Mutating Entity!
  return query; // Returns Entity with circular refs
},
```

### 5. Role Configuration

Role modes must be concatenated characters, not comma-separated:

```typescript
// ✅ Correct format
roles: ["admin:*", "user:r"]; // user can read
roles: ["admin:*", "user:cru"]; // user can create, read, update

// ❌ Incorrect format (causes validation error)
roles: ["admin:*", "user:c,r,u"]; // Error: invalid mode [,]
```

### 6. Session Role is String, Not Number

The server stores role in session as a **string name** (e.g., `'admin'`, `'user'`), not the integer value:

```typescript
// In customer.ts login handler:
const role_name = get_role_name(customer.role); // Converts 0 → 'admin', 1 → 'user'
req.session.user = { id: customer._id + "", name: customer.name, role: role_name };

// ✅ Correct - compare with string
const isAdmin = (req.session as any)?.user?.role === "admin";

// ❌ WRONG - comparing string with number always fails
const isAdmin = (req.session as any)?.user?.role === 0; // 'admin' !== 0
const isAdmin = (req.session as any)?.user?.role === ROLE.ADMIN; // Same issue
```

### 7. user_field Validation

The `user_field` must reference a field defined in the `fields` array:

```typescript
// ✅ Correct - 'customer' is defined in fields
{
  fields: [
    { name: 'customer', ref: 'customer', required: true },
    // ...
  ],
  user_field: 'customer',  // References the customer field
}

// ❌ Incorrect - '_id' is not in fields array
{
  fields: [...],
  user_field: '_id',  // Error: user_field [_id] not in field_names
}
```

### 8. TypeScript Declaration Files

When using `"declaration": true` in tsconfig.json, `.d.ts` files are generated in the output directory. This can cause issues with dynamic router loading.

**Solution**: Set `"declaration": false` for application code.

### 9. Elysia as Peer Dependency

hola-server has express as a peer dependency. If your router directly imports express:

```typescript
import express from "express";
const router = express.Router();
```

You must add express to your package.json dependencies.

### 10. hola-web Component Imports

Components are registered globally with `h-` prefix. Import from the main package:

```typescript
// ✅ Correct - import from main package
import { StatisticsView, ChartBarView } from "hola-web";

// ❌ Incorrect - direct path imports may not work
import StatisticsView from "hola-web/src/views/StatisticsView.vue";
```

---

## Component Showcase

### Views Components Used

| Component        | Purpose                      | Used In                                                    |
| ---------------- | ---------------------------- | ---------------------------------------------------------- |
| `h-crud`         | Full CRUD table with actions | CategoryManage, ProductManage, OrderManage, CustomerManage |
| `StatisticsView` | Dashboard stat cards         | DashboardView                                              |
| `ChartBarView`   | Bar charts                   | DashboardView (sales by month)                             |
| `ChartLineView`  | Line charts                  | DashboardView (order trends)                               |
| `ChartPieView`   | Pie charts                   | DashboardView (orders by status, sales by category)        |

### Vuetify Components Used

| Component      | Purpose                        |
| -------------- | ------------------------------ |
| `v-data-table` | Product listing, order history |
| `v-rating`     | Product ratings display/input  |
| `v-card`       | Product cards, order cards     |
| `v-chip`       | Status badges                  |
| `v-badge`      | Cart item count                |
| `v-dialog`     | Modals for forms               |
| `v-tabs`       | Dashboard sections             |

---

## File Structure

```
lesson_3_views/
├── design/
│   └── design.md           # This document
├── server/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── main.ts         # Entry point with seed data
│       ├── setting.ts      # Server configuration
│       ├── core/
│       │   └── type.ts     # Custom enums (ROLE, STATUS, etc.)
│       └── router/
│           ├── category.ts # Category CRUD
│           ├── product.ts  # Product CRUD + status actions
│           ├── customer.ts # Customer CRUD + auth
│           ├── order.ts    # Order CRUD + workflow
│           ├── review.ts   # Review CRUD + rating calc
│           └── dashboard.ts # Statistics APIs
└── web/
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── main.ts         # Vue entry + routes
        ├── App.vue         # Root component
        ├── core/
        │   └── type.ts     # Client-side types
        ├── composables/
        │   └── useCart.ts  # Shopping cart state
        ├── components/
        │   └── NavBar.vue  # Custom nav with cart
        ├── views/
        │   ├── LoginView.vue
        │   ├── ProductListView.vue
        │   ├── ProductDetailView.vue
        │   ├── CartView.vue
        │   ├── MyOrdersView.vue
        │   ├── DashboardView.vue
        │   ├── CategoryManageView.vue
        │   ├── ProductManageView.vue
        │   ├── OrderManageView.vue
        │   └── CustomerManageView.vue
        └── locales/
            └── en.json     # i18n messages
```

---

## Demo Accounts

| Role  | Email          | Password |
| ----- | -------------- | -------- |
| Admin | admin@demo.com | admin123 |
| User  | john@demo.com  | user123  |

---

## Key Patterns

### 1. Status Workflow Pattern

```typescript
// Define status enum
export const ORDER_STATUS = { PENDING: 0, PAID: 1, SHIPPED: 2, DELIVERED: 3, CANCELLED: 4 };

// Status transition endpoint
router.post("/status/:id", async (req, res) => {
  const id = req.params.id as string;
  const { status } = req.body;
  const query = oid_query(id);
  if (query) {
    await entity.update(query, { status, updatedAt: new Date() });
  }
  res.json({ code: SUCCESS });
});
```

### 2. User-Filtered Queries

```typescript
list_query: (...args: unknown[]) => {
  const query = args[0] as Record<string, unknown>;
  const req = args[1] as Request;
  const isAdmin = req.session?.user?.role === 'admin';
  if (!isAdmin && req.session?.user?.id) {
    query.customer = req.session.user.id;  // Filter by owner
  }
  return query;
},
```

### 3. Computed Rating Updates

```typescript
// After review create/update/delete, recalculate product rating
async function updateProductRating(productId: string) {
  const reviews = await reviewEntity.find({ product: productId });
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  await productEntity.update(oid_query(productId), { rating: avgRating });
}
```

### 4. Cart Composable Pattern

```typescript
// useCart.ts - Reactive cart with localStorage persistence
export function useCart() {
  const items = ref<CartItem[]>(loadFromStorage());

  const addItem = (product: Product) => { ... };
  const removeItem = (productId: string) => { ... };
  const totalAmount = computed(() => items.value.reduce(...));

  watch(items, saveToStorage, { deep: true });

  return { items, addItem, removeItem, totalAmount, ... };
}
```

---

## Common Issues & Solutions

| Issue                                | Cause                               | Solution                                       |
| ------------------------------------ | ----------------------------------- | ---------------------------------------------- |
| `Module has no exported member 'db'` | db is not a namespace export        | Import `oid_query` directly from 'hola-server' |
| `Type 'unknown' not assignable`      | CallbackFunction uses unknown args  | Use `(...args: unknown[])` and type assertions |
| `invalid mode [,]`                   | Comma in role mode string           | Use `'user:cru'` not `'user:c,r,u'`            |
| `user_field not in field_names`      | \_id not in fields array            | Use a defined field or remove user_field       |
| `.d.ts` files imported at runtime    | declaration: true in tsconfig       | Set `"declaration": false`                     |
| `authentication required` JSON shown | No route guard redirecting to login | Add `router.beforeEach()` navigation guard     |
| CORS blocked on different port       | Vite uses next available port       | Add multiple ports to `client_web_url` array   |
| `BSONError: circular structure`      | list_query returns Entity object    | Return new query object, not args[0]           |

---

## Additional Lessons Learned

### 11. CORS Configuration for Multiple Ports

Vite dev server automatically uses the next available port if the configured port is in use. Configure multiple ports in server settings:

```typescript
// setting.ts
server: {
  service_port: 3003,
  // Include all possible client ports to avoid CORS issues
  client_web_url: [
    'http://localhost:8083',
    'http://localhost:8084',
    'http://localhost:8085',
    'http://localhost:8086',
  ],
}
```

### 12. Vue Router Navigation Guards for Authentication

Implement route-level authentication using `router.beforeEach()`:

```typescript
// main.ts
import { createRouter, createWebHistory, type RouteLocationNormalized } from "vue-router";
import { axiosGet, isSuccessResponse } from "hola-web";

// Auth state
let userRole: number | null = null;
let authChecked = false;

// Check authentication
const checkAuth = async (): Promise<boolean> => {
  try {
    const response = await axiosGet<RoleResponse>("/customer/role");
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
    return { name: "login" };
  }

  // Check admin access
  if (to.meta.admin && userRole !== ROLE.ADMIN) {
    return { name: "products" };
  }

  return true;
});
```

### 13. Route Meta Flags Pattern

Use route meta for access control:

```typescript
const routes = [
  // Public routes - accessible without login
  { path: "/login", name: "login", component: LoginView, meta: { login: true, public: true } },
  { path: "/products", name: "products", component: ProductListView, meta: { public: true } },

  // Protected routes - require authentication
  { path: "/my-orders", name: "my-orders", component: MyOrdersView },

  // Admin routes - require admin role
  { path: "/admin/dashboard", name: "dashboard", component: DashboardView, meta: { admin: true } },
];
```

### 14. App.vue Login vs Main Layout Pattern

Use `route.meta.login` to conditionally render login page outside main app layout:

```vue
<template>
  <div>
    <!-- Login Page (no navbar, full-page layout) -->
    <template v-if="route.meta.login">
      <router-view />
    </template>

    <!-- Main App (with navbar and standard layout) -->
    <template v-else>
      <v-app>
        <NavBar ref="navBarRef" :title="t('app.title')" />
        <v-main>
          <router-view :key="route.fullPath" />
        </v-main>
      </v-app>
    </template>
  </div>
</template>
```

### 15. hola-web Global Component Names

Components are registered globally with `h-` prefix. Use in templates directly without import:

```vue
<!-- ✅ Correct - use global component names in template -->
<template>
  <h-navbar :title="title" :menus="menus" />
  <h-crud :meta="meta" />
  <h-stats :items="stats" />
  <h-bar-chart :title="title" :data="data" />
  <h-line-chart :title="title" :data="data" />
  <h-pie-chart :title="title" :data="data" />
</template>

<!-- ❌ Incorrect - importing components that should be used globally -->
<script setup>
// Don't import these - they're globally registered
import { StatisticsView } from "hola-web"; // Not needed
</script>
```

### 16. Logout Auth State Reset

When logging out, reset both local state and router auth state:

```typescript
// NavBar.vue
import { resetAuthState } from "@/main";

const logout = async () => {
  const { code } = await axiosGet<LogoutResponse>("/customer/logout");
  if (isSuccessResponse(code)) {
    role.value = null;
    user.value = null;
    resetAuthState(); // Reset router auth state
    router.push({ name: "login" });
  }
};
```

### 17. Server exclude_urls for Public APIs

APIs that should be accessible without authentication must be listed in `exclude_urls`:

```typescript
// setting.ts
server: {
  check_user: true,  // Enable authentication check
  exclude_urls: [
    '/customer/login',
    '/customer/register',
    '/product/list',    // Public product listing
    '/product/read',    // Public product detail
    '/category/list',   // Public category listing
    '/review/list',
    '/review/product',
    '/dashboard',       // Public dashboard stats
  ],
}
```

### 18. register_types is Server-Side Only

The `register_types()` function registers custom enum types with the hola-server type system. It must only be called on the server:

```typescript
// ✅ Server-side (main.ts or type.ts)
import { register_types } from './core/type.js';
register_types();

// ❌ Client-side - don't call register_types
// The web client only needs the constant values for display
export const ROLE = { ADMIN: 0, USER: 1 };
export const ORDER_STATUS = { PENDING: 0, PAID: 1, ... };
```

### 19. HTTP GET vs POST Patterns

The `init_router` function creates default endpoints with specific HTTP methods:

| Endpoint         | Method   | Purpose                 | Body Params           |
| ---------------- | -------- | ----------------------- | --------------------- |
| `/meta`          | GET      | Fetch field definitions | -                     |
| `/mode`          | GET      | Fetch user permissions  | -                     |
| `/ref`           | GET      | Fetch reference labels  | query params          |
| `/list`          | **POST** | Paginated/filtered list | `{ _query: {...} }`   |
| `/read_entity`   | **POST** | Read single entity      | `{ _id, attr_names }` |
| `/read_property` | **POST** | Read entity property    | `{ _id, attr_names }` |

#### When to Use Custom GET Endpoints

For simple public read operations without complex query params, add custom GET endpoints:

```typescript
// product.ts - Custom GET endpoints for simple reads
route: (router, meta) => {
  const entity = new Entity(meta);

  // GET /list - Simple public listing (no pagination params)
  router.get('/list', wrap_http(async function (req: Request, res: Response) {
    const isAdmin = req.session?.user?.role === 'admin';
    const query: Record<string, unknown> = {};
    if (!isAdmin) {
      query.status = PRODUCT_STATUS.PUBLISHED;
    }
    const products = await entity.find(query);
    res.json({ code: SUCCESS, data: products });
  }));

  // GET /read/:id - Read single entity by ID
  router.get('/read/:id', wrap_http(async function (req: Request, res: Response) {
    const id = req.params.id as string;
    const query = oid_query(id);
    if (!query) {
      res.json({ code: SUCCESS, data: null });
      return;
    }
    const product = await entity.find_one(query);
    res.json({ code: SUCCESS, data: product });
  }));

  // ... other custom routes
},
```

#### Web Client Matching

Ensure web client uses the correct axios method:

```typescript
// ✅ Correct - GET for simple reads
const response = await axiosGet<ProductListResponse>("/product/list");
const detail = await axiosGet<ProductResponse>(`/product/read/${id}`);

// ✅ Correct - POST for mutations or complex queries
const response = await axiosPost<OrderResponse>("/order/place", { items, total });

// ❌ Incorrect - using GET for POST endpoint (will fail)
const response = await axiosGet("/product/list"); // If no custom GET /list exists
```

#### When to Keep POST

Keep using POST when:

- Complex query objects with pagination, sorting, filters
- Query params exceed URL length limits (~2000 chars)
- Request body contains arrays or nested objects
- Sensitive data shouldn't appear in server logs/browser history

### 20. Role Type Consistency: String vs Number

The server returns role as a **string** (e.g., `"admin"`, `"user"`), not a number. Client code must use string comparisons:

```typescript
// Server returns role as string
export const get_role_name = (role_int: number): string | null => {
  return settings.roles[role_int].name; // Returns "admin", "user", etc.
};

// ✅ Correct - use string type and string comparison
let userRole: string | null = null;

if (userRole === "admin") {
  // Show admin menu
}

if (to.meta.admin && userRole !== "admin") {
  return { name: "products" }; // Redirect non-admins
}

// ❌ Incorrect - number comparison will always fail
let userRole: number | null = null; // Wrong type!

if (userRole !== ROLE.ADMIN) {
  // "admin" !== 0 is always true!
  return { name: "products" };
}
```

### 21. Client-Side Type Registration with hola-web

Custom types (like `product_status`, `order_status`) must be registered on **both** server and client:

```typescript
// web/src/core/type.ts
import { registerType } from "hola-web";
import type { TypeDefinition, SelectItem } from "hola-web";

/**
 * Creates an int enum type with i18n support for client-side rendering
 */
const createIntEnumType = (name: string, labels: string[], i18n_prefix: string = name): TypeDefinition => ({
  name,
  inputType: "autocomplete",
  items: (ctx: unknown) => {
    const vue = ctx as { t: (key: string) => string };
    return labels.map(
      (label, i): SelectItem => ({
        value: i,
        title: vue.t(`type.${i18n_prefix}_${label}`),
      })
    );
  },
  format: (value: unknown, t?: (key: string) => string): string => {
    if (value === undefined || value === null || value === "") return "";
    const label = labels[value as number];
    return label && t ? t(`type.${i18n_prefix}_${label}`) : "";
  },
});

export const register_types = (): void => {
  registerType(createIntEnumType("role", ["admin", "user"]));
  registerType(createIntEnumType("customer_status", ["active", "inactive"]));
  registerType(createIntEnumType("product_status", ["draft", "published", "discontinued"]));
  registerType(createIntEnumType("order_status", ["pending", "paid", "shipped", "delivered", "cancelled"]));
};

// main.ts - Call register_types before app initialization
import { register_types } from "./core/type";
register_types();
```

### 22. Locale File Requirements for hola-web Components

hola-web components (`h-crud`, `h-navbar`, etc.) require specific locale keys. The app's locale file must include:

```json
{
  "type": {
    "product_status_draft": "Draft",
    "product_status_published": "Published",
    "order_status_pending": "Pending"
  },
  "form": {
    "create_title": "Create {entity}",
    "search_title": "Search {entity}",
    "update_title": "Update {entity}",
    "cancel_label": "Cancel",
    "submit_label": "Submit",
    "required": "{field} is required.",
    "create_success_hint": "Create {entity} successful",
    "clone_title": "Clone {entity}",
    "error": ". Error: {err}"
  },
  "confirm": {
    "yes": "Yes",
    "no": "No",
    "close": "Close"
  },
  "table": {
    "title": "{entity} List",
    "action_header": "Action",
    "create_title": "Create {entity}",
    "refresh_title": "Refresh {entity} List",
    "update_title": "Update {entity}",
    "clone_title": "Clone {entity}",
    "delete_title": "Delete {entity}",
    "no_data": "No Data",
    "delete_confirm": "Are you sure to delete {entity}?",
    "switch_to_batch": "Switch to batch mode",
    "total_record": " ({total} records)"
  }
}
```

**Key points:**

- Custom type labels use pattern `type.{type_name}_{value_label}` (e.g., `type.product_status_draft`)
- The `{entity}` placeholder is replaced by the entity's `_label` field from locale (e.g., `product._label: "Product"`)
- Missing keys cause `[intlify] Not found` warnings and broken UI text

### 23. Always Use i18n for User-Facing Text (CRITICAL)

**NEVER hardcode user-facing strings in Vue templates.** Always use `$t()` or `t()` for internationalization support:

```vue
<!-- ❌ WRONG - Hardcoded strings -->
<template>
  <h1>Category Management</h1>
  <div class="text-body-2">Total Orders</div>
  <v-tooltip>View Details</v-tooltip>
</template>

<!-- ✅ CORRECT - Using i18n -->
<script setup>
import { useI18n } from "vue-i18n";
const { t } = useI18n();
</script>

<template>
  <h1>{{ t("view.category_management") }}</h1>
  <div class="text-body-2">{{ t("my_orders.total_orders") }}</div>
  <v-tooltip>{{ t("my_orders.view_details") }}</v-tooltip>
</template>
```

**Why this matters:**

- Enables multi-language support without code changes
- Consistent terminology across the application
- Centralized text management in locale files
- Required for professional applications

**Common places to check for hardcoded strings:**

- Page titles (`<h1>`, `<h2>`)
- Card labels and statistics text
- Table column headers
- Button labels and tooltips
- Dialog titles
- Empty state messages
- Error messages

### 24. Deep Merge Locale Messages with `deepMerge`

When merging hola-web locale messages with app-specific messages, use `deepMerge` instead of spread operator to preserve nested keys:

```typescript
// ❌ WRONG - Shallow merge overwrites nested objects
const messages = {
  en: { ...holaEnMessages, ...appMessages.en }, // app's `type` object replaces hola-web's `type`
};

// ✅ CORRECT - Deep merge preserves nested keys
import { loadLocaleMessagesEager, deepMerge } from "hola-web";
import holaEnMessages from "hola-web/locales/en.json";

const messages = {
  en: deepMerge(holaEnMessages as Record<string, unknown>, (appMessages.en || {}) as Record<string, unknown>),
};
```

**Why this matters:**

- Spread operator (`...`) only does shallow merge - nested objects are completely replaced
- If your app defines `type: { product_status_draft: "Draft" }`, it will overwrite ALL of hola-web's `type` object
- This causes missing translations like `type.boolean_true` (used by boolean fields in tables)
- `deepMerge` recursively merges objects, preserving keys from both sources

### 25. Don't Define Mode in Client - Let Server Control It (IMPORTANT)

**The `mode` (permissions like `bcduprs`) should NOT be defined in the client.** The `h-crud` component automatically fetches the mode from the server via the `/mode` endpoint, which returns role-based permissions.

```vue
<!-- ❌ WRONG - Hardcoding mode in client -->
<script setup>
const mode = "bcduprs"; // Don't define this!
</script>
<template>
  <h-crud :entity="entity" :mode="mode" />
</template>

<!-- ✅ CORRECT - Let h-crud fetch mode from server -->
<script setup>
const entity = "category";
</script>
<template>
  <h-crud :entity="entity" />
</template>
```

**Why this matters:**

- Server controls permissions via role configuration (e.g., `roles: ['admin:*', 'user:r']`)
- Different users see different actions based on their role
- Hardcoding mode bypasses role-based access control
- Only override mode if you need to **restrict** permissions further than server allows

**When to override mode:**

- To hide certain actions for UX reasons (not security - server still enforces)
- To create a simplified view that shows fewer options

```vue
<!-- Only show read-only view, even if user has more permissions -->
<h-crud :entity="entity" mode="r" />
```

### 26. DataTable Custom Headers with `mergeWithServer`

When customizing table headers (for formatting, chips, styles, or expand), use `mergeWithServer: true` (default in CrudTable) to show ALL server fields with your custom overrides:

```typescript
// Custom headers - only define fields that need special rendering
const headers = [
  {
    name: "status",
    chip: true, // Display as colored chip
    format: (value: number) => STATUS_LABELS[value] || "Unknown",
    style: (value: number) => {
      // Return Vuetify color name for chip
      if (value === STATUS.ACTIVE) return "success";
      if (value === STATUS.PENDING) return "warning";
      return "error";
    },
  },
  {
    name: "description",
    expand: (value: string) => `<tr><td>Description</td><td>${value}</td></tr>`,
  },
];
```

**Key points:**

- With `mergeWithServer: true`, all server fields display; custom headers override specific fields
- Without it, only fields defined in headers array would show
- CrudTable defaults to `mergeWithServer: true`

### 27. Chip Fields: Use `style` for Color, `format` for Label

For chip fields, both `format` and `style` functions receive the **raw value** (not formatted):

```typescript
{
  name: "status",
  chip: true,
  // format: converts raw value (number) to display label
  format: (value: number) => STATUS_LABELS[value] || "Unknown",
  // style: returns Vuetify color name based on raw value
  style: (value: number) => {
    if (value === 0) return "success";  // green chip
    if (value === 1) return "warning";  // yellow chip
    return "error";                      // red chip
  },
}
```

**Important:** Chip fields with `style` or `format` are NOT pre-formatted during data load. The raw value is preserved so both functions can work correctly with the original data type.

### 28. Expand Fields for Long Content

Use `expandFields` to move verbose fields (description, images) into expandable rows:

```vue
<script setup>
// Fields to show in expanded row (hidden from main table columns)
const expandFields = ["description", "image"];

// Custom expand rendering with table layout
const headers = [
  {
    name: "description",
    expand: (value: string) => `
      <tr>
        <td style="padding: 8px; font-weight: bold; width: 120px;">Description</td>
        <td style="padding: 8px;">${value || "No data"}</td>
      </tr>
    `,
  },
  {
    name: "image",
    expand: (value: string) => `
      <tr>
        <td style="padding: 8px; font-weight: bold; width: 120px;">Image</td>
        <td style="padding: 8px;">
          ${value ? `<img src="${value}" style="max-width: 200px;">` : "No image"}
        </td>
      </tr>
    `,
  },
];
</script>

<template>
  <h-crud :entity="entity" :headers="headers" :expand-fields="expandFields" />
</template>
```

**Key points:**

- Expand fields are excluded from table columns but included in expandable row
- Return `<tr><td>...</td></tr>` elements - they're wrapped in a `<table>` automatically
- Use `expandAsText: true` prop if you want plain text instead of HTML rendering

### 29. Action Column Width Auto-Calculation

CrudTable automatically calculates action column width based on the number of action buttons:

```typescript
// CrudTable internal calculation
const actionWidthComputed = computed(() => {
  const count = itemActionsComputed.value?.length || 0;
  const width = Math.max(count * 44, 50); // 44px per button, minimum 50px
  return `${width}px`;
});
```

**Result:** With 6 actions, width = 264px, ensuring all buttons fit on one line.

### 30. Custom Actions with Conditional Visibility

Define custom row actions with `shown` function to conditionally display:

```typescript
const actions = [
  {
    icon: "mdi-publish",
    color: "success",
    tooltip: t("product.publish"),
    handle: async (item: Product) => {
      await publishProduct(item._id);
    },
    // Only show for draft products
    shown: (item: Product) => item.status === PRODUCT_STATUS.DRAFT,
  },
  {
    icon: "mdi-publish-off",
    color: "warning",
    tooltip: t("product.unpublish"),
    handle: async (item: Product) => {
      await unpublishProduct(item._id);
    },
    // Only show for published products
    shown: (item: Product) => item.status === PRODUCT_STATUS.PUBLISHED,
  },
];
```

**Note:** Action width calculation includes ALL defined actions, not just visible ones. This prevents layout shifts when different rows show different actions.

### 31. Field Display Rules and Search Column Layout (BKM)

#### DO: Move These Fields to Expand Section

| Field Type    | Action                                    |
| ------------- | ----------------------------------------- |
| `text`        | → expand (disrupts table column widths)   |
| `description` | → expand (long-form content)              |
| `icon`        | → expand (render visually with icon name) |
| `image`       | → expand (render as thumbnail)            |
| `notes`       | → expand (variable length)                |
| `content`     | → expand (HTML/rich text)                 |

#### DO: Use Custom Headers with `expand` Function for Rich Rendering

```vue
<script setup>
import { useI18n } from "vue-i18n";
const { t } = useI18n();

const expandFields = ["description", "icon"];

// Custom headers render expand fields in table format
const headers = [
  {
    name: "description",
    expand: (value: string) => `
      <tr>
        <td style="padding: 8px; font-weight: bold; width: 120px;">${t("entity.description")}</td>
        <td style="padding: 8px; white-space: pre-wrap;">${value || t("common.no_data")}</td>
      </tr>
    `,
  },
  {
    name: "icon",
    expand: (value: string) => `
      <tr>
        <td style="padding: 8px; font-weight: bold; width: 120px;">${t("entity.icon")}</td>
        <td style="padding: 8px;">
          <span class="mdi ${value}" style="font-size: 32px;"></span>
          <span style="margin-left: 8px; color: #666;">${value}</span>
        </td>
      </tr>
    `,
  },
  {
    name: "image",
    expand: (value: string) => `
      <tr>
        <td style="padding: 8px; font-weight: bold; width: 120px;">${t("entity.image")}</td>
        <td style="padding: 8px;">
          ${value ? `<img src="${value}" style="max-width: 200px; max-height: 150px; border-radius: 4px;">` : t("common.no_image")}
        </td>
      </tr>
    `,
  },
];
</script>

<template>
  <h-crud :entity="entity" :expand-fields="expandFields" :headers="headers" />
</template>
```

#### DO: Set Search Columns Based on Field Count

| Search Field Count | `searchCols` | Layout           |
| ------------------ | ------------ | ---------------- |
| 1                  | 12 (default) | 1 field per row  |
| 2-4                | 6            | 2 fields per row |
| 5+                 | 4            | 3 fields per row |

```vue
<script setup>
// Search fields defined in server meta with search: true
// Only set layout cols on client based on search field count
const searchCols = 6; // 2-4 fields → col = 6
</script>

<template>
  <h-crud :entity="entity" :search-cols="searchCols" />
</template>
```

#### DO: Design Search Fields with User Intent (Server-Side)

Fields are searchable by default (`search: true`). Mark fields with `search: false` if they are **NOT meaningful for users to search/filter**:

| Field Type    | Searchable? | Action                                   |
| ------------- | ----------- | ---------------------------------------- |
| `name`        | ✓ Yes       | Default (no change needed)               |
| `status`      | ✓ Yes       | Default (no change needed)               |
| `category`    | ✓ Yes       | Default (no change needed)               |
| `description` | ✗ No        | `search: false` — long text, expand only |
| `icon`        | ✗ No        | `search: false` — technical field        |
| `sortOrder`   | ✗ No        | `search: false` — internal ordering      |
| `image`       | ✗ No        | `search: false` — URL/path               |
| `createdAt`   | Maybe       | Keep default if date filter needed       |

```typescript
// Server: category.ts - Mark unsearchable fields with search: false
fields: [
  { name: 'name', required: true },                           // searchable (default)
  { name: 'description', search: false },                     // expand only
  { name: 'icon', default: 'mdi-folder', search: false },     // not searchable
  { name: 'active', type: 'boolean', default: true },         // searchable (default)
  { name: 'sortOrder', type: 'number', default: 0, search: false }, // not searchable
],
```

#### DON'T

- ❌ Define `searchFields` on client — server meta controls this
- ❌ Leave all fields searchable — mark non-meaningful ones `search: false`
- ❌ Show `text`/`description` fields in main table columns
- ❌ Show raw icon names without visual rendering
- ❌ Show image URLs as text

### 32. Breadcrumbs Navigation (h-bread) - BKM

Use `h-bread` component to provide visual navigation hierarchy and quick back-navigation for users.

#### When to Use Breadcrumbs

| Page Type          | Use Breadcrumbs? | Reason                                 |
| ------------------ | ---------------- | -------------------------------------- |
| Dashboard/Home     | ✗ No             | Root page, no parent to navigate to    |
| Admin CRUD pages   | ✓ Yes            | Shows "Dashboard > Manage X" hierarchy |
| Detail pages       | ✓ Yes            | Shows "List > Detail" hierarchy        |
| Cart/Checkout      | ✓ Yes            | Shows "Products > Cart" hierarchy      |
| User account pages | ✓ Yes            | Shows "Products > My Orders" hierarchy |
| Login/Register     | ✗ No             | Standalone auth pages                  |

#### Component Registration (main.ts)

```typescript
// Import component
import BreadCrumbs from "./components/BreadCrumbs.vue";

// Register globally after installComponents()
installComponents(app);
app.component("h-bread", BreadCrumbs);
```

#### Usage in Views

```vue
<template>
  <v-container fluid>
    <!-- Breadcrumbs at top, before any content -->
    <h-bread></h-bread>

    <!-- Page content (NO duplicate h1 title needed) -->
    <h-crud :entity="entity" ... />
  </v-container>
</template>
```

#### BreadCrumbs Component Structure

```typescript
interface BreadcrumbItem {
  title: string; // Display text (use i18n: t('menu.xxx'))
  disabled: boolean; // true = current page (not clickable)
  href?: string; // Navigation path (omit for disabled items)
}

// Example breadcrumb hierarchy
const items = [
  { title: t("menu.dashboard"), disabled: false, href: "/admin/dashboard" },
  { title: t("menu.manage_categories"), disabled: true }, // Current page
];
```

#### Route-Based Breadcrumb Rules

| Route Pattern       | Breadcrumb Items                  |
| ------------------- | --------------------------------- |
| `/admin/dashboard`  | `[Dashboard (disabled)]`          |
| `/admin/categories` | `[Dashboard → Manage Categories]` |
| `/admin/products`   | `[Dashboard → Manage Products]`   |
| `/admin/orders`     | `[Dashboard → Manage Orders]`     |
| `/admin/customers`  | `[Dashboard → Manage Customers]`  |
| `/products`         | `[Products (disabled)]`           |
| `/product/:id`      | `[Products → Detail]`             |
| `/cart`             | `[Products → Cart]`               |
| `/my-orders`        | `[Products → My Orders]`          |

#### Close Button Behavior

The close (X) button navigates to the **second-to-last** breadcrumb item:

```typescript
const close = () => {
  if (items.value.length > 1) {
    const last = items.value[items.value.length - 2]; // Parent page
    if (last.href && route.path !== home) {
      router.push({ path: last.href });
    }
  }
};
```

#### DO

- ✅ Place `<h-bread>` at top of page content, inside `<v-container>`
- ✅ Use i18n for all breadcrumb titles: `t('menu.xxx')`
- ✅ Mark current page as `disabled: true` (not clickable)
- ✅ Provide `href` for all parent items (clickable)
- ✅ Remove duplicate `<h1>` titles when using breadcrumbs (breadcrumbs serve as navigation indicator)

#### DON'T

- ❌ Show breadcrumbs on root/home pages (Dashboard, Products list)
- ❌ Show breadcrumbs on login/register pages
- ❌ Hardcode breadcrumb titles — use i18n
- ❌ Have both `<h-bread>` AND `<h1>` page titles — pick one
- ❌ Make current page breadcrumb clickable

#### Conditional Breadcrumbs (Optional)

For pages that can be both root and child (e.g., blog list vs. user's blog):

```vue
<script setup>
defineProps<{
  noBread?: boolean;  // Hide breadcrumbs when used as root page
}>();
</script>

<template>
  <div>
    <h-bread v-if="!noBread"></h-bread>
    <!-- Page content -->
  </div>
</template>
```

#### Extending for Dynamic Routes

For routes with dynamic parameters (e.g., `/stock_blog/:type/:code`):

```typescript
// Extract dynamic values from route
const paths = route.path.split("/").filter(Boolean);
const type = paths[1];
const stockName = paths[2]?.split(",")[2]; // Parse comma-separated params

// Build dynamic breadcrumbs
if (type === "dashboard") {
  items.value = [
    { title: t("menu.dashboard"), disabled: false, href: "/" },
    { title: stockName, disabled: true },
  ];
} else {
  const isTag = type.startsWith("tag_");
  const title = isTag ? type.substring(4) : t("menu." + type);
  items.value = [
    { title: t("menu.dashboard"), disabled: false, href: "/" },
    { title: title, disabled: false, href: `/trade/${type}` },
    { title: stockName, disabled: true },
  ];
}
```
