---
name: h-bread
description: Add breadcrumb navigation to show users their current location and navigation path. Use when the user needs to navigate deep paths, show page hierarchy, or provide quick back-navigation in multi-level views.
---

# Breadcrumb Navigation (h-bread)

Add breadcrumb navigation to show users their current location in the application hierarchy.

## When to Use This Skill

- User needs to navigate **deep paths** (User List → User Detail)
- User wants to show **navigation hierarchy** (Dashboard → Manage Products)
- User needs **quick back-navigation** (close button returns to parent)
- User has **multi-level views** accessed from different entry points
- User wants users to understand their **current location** in the app

## Quick Answer

**Add breadcr to a page:**

```vue
<template>
  <v-container fluid>
    <!-- Breadcrumb at the top -->
    <h-bread></h-bread>
    
    <!-- Page content -->
    <h-crud entity="product"></h-crud>
  </v-container>
</template>
```

**The breadcrumb automatically shows:** `Dashboard > Manage Products`

## Why Use Breadcrumbs?

### Problem: Users Get Lost

Without breadcrumbs:
- ❌ Users don't know where they are
- ❌ Must use browser back button (loses context)
- ❌ Can't jump to parent pages quickly
- ❌ Navigation path is unclear

### Solution: Breadcrumb Navigation

With breadcrumbs:
- ✅ Shows current location: `Dashboard > Manage Products > Product Detail`
- ✅ Click any parent to jump back
- ✅ Close button (X) returns to parent page
- ✅ Clear visual hierarchy

## Step-by-Step Instructions

### Step 1: Create BreadCrumbs Component

**Location:** `hola-web/src/components/BreadCrumbs.vue`

```vue
<script setup lang="ts">
/**
 * BreadCrumbs Component (h-bread)
 * Navigation breadcrumbs with close button to go back.
 */
import { ref, onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";

interface BreadcrumbItem {
  title: string;
  disabled: boolean;  // true = current page (not clickable)
  href?: string;      // Navigation path
}

const router = useRouter();
const route = useRoute();
const { t } = useI18n();

const items = ref<BreadcrumbItem[]>([]);

// Build breadcrumb items based on current route
const buildBreadcrumbs = () => {
  const path = route.path;
  const paths = path.split("/").filter(Boolean);

  // Default: Dashboard as home
  const dashboardItem: BreadcrumbItem = {
    title: t("menu.dashboard"),
    disabled: false,
    href: "/admin/dashboard",
  };

  // Handle admin routes
  if (paths[0] === "admin") {
    const section = paths[1];

    switch (section) {
      case "dashboard":
        items.value = [{ title: t("menu.dashboard"), disabled: true }];
        break;
      case "categories":
        items.value = [dashboardItem, { title: t("menu.manage_categories"), disabled: true }];
        break;
      case "products":
        items.value = [dashboardItem, { title: t("menu.manage_products"), disabled: true }];
        break;
      case "orders":
        items.value = [dashboardItem, { title: t("menu.manage_orders"), disabled: true }];
        break;
      case "users":
        items.value = [dashboardItem, { title: t("menu.manage_users"), disabled: true }];
        break;
      default:
        items.value = [dashboardItem];
    }
  }
  // Handle user/public routes
  else if (paths[0] === "products") {
    items.value = [{ title: t("menu.products"), disabled: true }];
  } else if (paths[0] === "product") {
    items.value = [
      { title: t("menu.products"), disabled: false, href: "/products" },
      { title: t("common.detail"), disabled: true },
    ];
  } else if (paths[0] === "cart") {
    items.value = [
      { title: t("menu.products"), disabled: false, href: "/products" },
      { title: t("menu.cart"), disabled: true },
    ];
  } else if (paths[0] === "my-orders") {
    items.value = [
      { title: t("menu.products"), disabled: false, href: "/products" },
      { title: t("menu.my_orders"), disabled: true },
    ];
  } else {
    // Fallback - single item
    items.value = [{ title: t("menu.home"), disabled: true }];
  }
};

// Navigate to previous breadcrumb on close
const close = () => {
  if (items.value.length > 1) {
    const last = items.value[items.value.length - 2];  // Parent page
    if (last.href) {
      router.push({ path: last.href });
    }
  }
};

onMounted(() => {
  buildBreadcrumbs();
});

// Watch route changes to update breadcrumbs
watch(() => route.path, () => {
  buildBreadcrumbs();
});
</script>

<template>
  <v-system-bar window class="system_bar mb-3">
    <v-breadcrumbs :items="items">
      <template #divider>
        <v-icon>mdi-chevron-right</v-icon>
      </template>
    </v-breadcrumbs>
    <v-spacer></v-spacer>
    <v-icon @click="close" style="cursor: pointer">mdi-close</v-icon>
  </v-system-bar>
</template>

<style scoped>
.system_bar {
  background-color: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
```

### Step 2: Register Component Globally

**Location:** `hola-web/src/main.ts`

```typescript
import BreadCrumbs from "./components/BreadCrumbs.vue";

// After installComponents(app)
installComponents(app);
app.component("h-bread", BreadCrumbs);
```

### Step 3: Add to Views

```vue
<!-- ProductManageView.vue -->
<template>
  <v-container fluid>
    <!-- Add breadcrumb at top -->
    <h-bread></h-bread>
    
    <!-- Page content -->
    <h-crud
      entity="product"
      item-label-key="name">
    </h-crud>
  </v-container>
</template>
```

### Step 4: Add i18n Translations

**Location:** `hola-web/src/locales/en.json`

```json
{
  "menu": {
    "dashboard": "Dashboard",
    "manage_products": "Manage Products",
    "manage_categories": "Manage Categories",
    "manage_orders": "Manage Orders",
    "manage_users": "Manage Users",
    "products": "Products",
    "cart": "Cart",
    "my_orders": "My Orders"
  },
  "common": {
    "detail": "Detail",
    "home": "Home"
  }
}
```

## Handling Same View from Different Paths

### Problem: Same View, Different Entry Points

The same view (e.g., UserDetailView) can be accessed from different paths:

**Entry Point 1:** User clicks on their own profile
- Path: `/user/:id`
- Breadcrumb: `Home > My Profile`

**Entry Point 2:** Admin views user from admin console
- Path: `/admin/user/:id`
- Breadcrumb: `Dashboard > Manage Users > User Detail`

### Solution: Define Routes with Different Names

**Define separate routes with different names for the SAME component:**

```javascript
// hola-web/src/router/index.ts
const routes = [
  // User viewing their own info
  {
    path: '/user/:id',
    name: 'my_user_info',
    component: UserDetailView,
    meta: { requiresAuth: true }
  },
  
  // Admin viewing user info
  {
    path: '/admin/user/:id',
    name: 'admin_user_view',
    component: UserDetailView,
    meta: { requiresAuth: true, admin: true }
  }
];
```

### Breadcrumb Detection Based on Route

Update `buildBreadcrumbs()` to check route name or path:

```typescript
const buildBreadcrumbs = () => {
  const path = route.path;
  const name = route.name;  // Route name
  const paths = path.split("/").filter(Boolean);

  // Check route name for user detail views
  if (name === 'my_user_info') {
    items.value = [
      { title: t("menu.home"), disabled: false, href: "/" },
      { title: t("menu.my_profile"), disabled: true }
    ];
    return;
  }

  if (name === 'admin_user_view') {
    items.value = [
      { title: t("menu.dashboard"), disabled: false, href: "/admin/dashboard" },
      { title: t("menu.manage_users"), disabled: false, href: "/admin/users" },
      { title: t("common.user_detail"), disabled: true }
    ];
    return;
  }

  // Continue with path-based detection...
  if (paths[0] === "admin") {
    // Admin routes...
  }
};
```

## Common Breadcrumb Patterns

### Pattern 1: Admin CRUD Pages

```typescript
// Dashboard → Manage X
{ path: '/admin/products', name: 'admin_products' }
// Breadcrumb: [Dashboard → Manage Products]

const breadcrumb = [
  { title: t("menu.dashboard"), disabled: false, href: "/admin/dashboard" },
  { title: t("menu.manage_products"), disabled: true }
];
```

### Pattern 2: Detail Pages

```typescript
// List → Detail
{ path: '/product/:id', name: 'product_detail' }
// Breadcrumb: [Products → Detail]

const breadcrumb = [
  { title: t("menu.products"), disabled: false, href: "/products" },
  { title: t("common.detail"), disabled: true }
];
```

### Pattern 3: Multi-Level Navigation

```typescript
// Home → Category → Product
{ path: '/category/:catId/product/:id', name: 'category_product' }
// Breadcrumb: [Products → Electronics → Laptop Detail]

const breadcrumb = [
  { title: t("menu.products"), disabled: false, href: "/products" },
  { title: categoryName, disabled: false, href: `/category/${catId}` },
  { title: productName, disabled: true }
];
```

### Pattern 4: User Account Pages

```typescript
// Products → My Orders
{ path: '/my-orders', name: 'my_orders' }
// Breadcrumb: [Products → My Orders]

const breadcrumb = [
  { title: t("menu.products"), disabled: false, href: "/products" },
  { title: t("menu.my_orders"), disabled: true }
];
```

## When to Use Breadcrumbs

### ✅ Use Breadcrumbs For:

| Page Type | Example | Breadcrumb |
|-----------|---------|------------|
| Admin CRUD pages | `/admin/products` | `Dashboard > Manage Products` |
| Detail pages | `/product/:id` | `Products > Detail` |
| User account | `/my-orders` | `Products > My Orders` |
| Multi-level views | `/category/:id/product/:id` | `Products > Category > Detail` |
| Cart/Checkout | `/cart` | `Products > Cart` |

### ❌ Don't Use Breadcrumbs For:

| Page Type | Reason |
|-----------|--------|
| Dashboard/Home | Root page, no parent |
| Login/Register | Standalone auth pages |
| Root list pages | No parent to navigate to |

## BreadcrumbItem Interface

```typescript
interface BreadcrumbItem {
  title: string;        // Display text (use i18n)
  disabled: boolean;    // true = current page (not clickable)
  href?: string;        // Navigation path (omit for current page)
}
```

**Example:**

```typescript
const items: BreadcrumbItem[] = [
  {
    title: t("menu.dashboard"),
    disabled: false,           // Clickable
    href: "/admin/dashboard"   // Target path
  },
  {
    title: t("menu.manage_products"),
    disabled: true             // Current page (not clickable)
    // No href needed
  }
];
```

## Close Button Behavior

The **close (X) button** navigates to the parent page (second-to-last breadcrumb):

```typescript
const close = () => {
  if (items.value.length > 1) {
    const parent = items.value[items.value.length - 2];  // Parent page
    if (parent.href) {
      router.push({ path: parent.href });
    }
  }
};
```

**Example:**
- Current breadcrumb: `Dashboard > Manage Products > Product Detail`
- Click X → Navigate to `Manage Products`

## Best Practices

### 1. Always Use i18n

```typescript
// ✅ GOOD
{ title: t("menu.dashboard"), disabled: true }

// ❌ BAD
{ title: "Dashboard", disabled: true }
```

### 2. Mark Current Page as Disabled

```typescript
// ✅ GOOD - Current page not clickable
{
  title: t("menu.manage_products"),
  disabled: true
}

// ❌ BAD - Current page clickable
{
  title: t("menu.manage_products"),
  disabled: false,
  href: "/admin/products"  // Don't do this!
}
```

### 3. Provide href for All Parents

```typescript
// ✅ GOOD - Parent is clickable
{
  title: t("menu.dashboard"),
  disabled: false,
  href: "/admin/dashboard"
}

// ❌ BAD - Parent not clickable
{
  title: t("menu.dashboard"),
  disabled: false
  // Missing href!
}
```

### 4. Don't Duplicate Page Titles

```vue
<!-- ❌ BAD - Redundant title -->
<template>
  <h-bread></h-bread>
  <h1>{{ t("menu.manage_products") }}</h1>  <!-- Duplicate! -->
  <h-crud entity="product"></h-crud>
</template>

<!-- ✅ GOOD - Breadcrumb serves as title -->
<template>
  <h-bread></h-bread>
  <h-crud entity="product"></h-crud>
</template>
```

### 5. Place at Top of Container

```vue
<!-- ✅ GOOD - First element in container -->
<template>
  <v-container fluid>
    <h-bread></h-bread>
    <!-- Content -->
  </v-container>
</template>

<!-- ❌ BAD - After content -->
<template>
  <v-container fluid>
    <h-crud entity="product"></h-crud>
    <h-bread></h-bread>  <!-- Too late! -->
  </v-container>
</template>
```

## Advanced: Dynamic Breadcrumbs

For routes with dynamic data (e.g., product name in breadcrumb):

```typescript
import { ref } from "vue";

const productName = ref("");

const buildBreadcrumbs = async () => {
  if (route.name === 'product_detail') {
    // Fetch product name
    const productId = route.params.id;
    const product = await fetchProduct(productId);
    productName.value = product.name;
    
    items.value = [
      { title: t("menu.products"), disabled: false, href: "/products" },
      { title: productName.value, disabled: true }  // Dynamic name
    ];
  }
};
```

## Troubleshooting

### Problem: Breadcrumbs don't update when route changes

**Solution:** Add `watch` to detect route changes:

```typescript
import { watch } from "vue";

watch(() => route.path, () => {
  buildBreadcrumbs();
});
```

### Problem: Close button doesn't work

**Check 1:** Is parent item missing `href`?

```typescript
// ❌ BAD - No href
{ title: t("menu.dashboard"), disabled: false }

// ✅ GOOD
{ title: t("menu.dashboard"), disabled: false, href: "/admin/dashboard" }
```

**Check 2:** Is there only one breadcrumb item?

```typescript
// Close button won't work if items.length === 1
if (items.value.length > 1) {  // Need at least 2 items
  const parent = items.value[items.value.length - 2];
  router.push({ path: parent.href });
}
```

### Problem: Breadcrumb titles show keys instead of translations

**Solution:** Add missing i18n keys:

```json
{
  "menu": {
    "manage_products": "Manage Products"
  }
}
```

## Quick Reference

| Task | Code |
|------|------|
| Add breadcrumb | `<h-bread></h-bread>` |
| Register component | `app.component("h-bread", BreadCrumbs)` |
| Create breadcrumb item | `{ title: t("menu.products"), disabled: false, href: "/products" }` |
| Mark current page | `disabled: true` |
| Make clickable | `disabled: false, href: "/path"` |
| Close button target | Second-to-last breadcrumb item |

## Related Skills

- **i18n** - Translate breadcrumb titles
- **crud-table-list** - Manage product/category/order lists
- **h-crud** - Main CRUD component used with breadcrumbs

## Complete Example: E-commerce

```vue
<!-- ProductDetailView.vue -->
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";

const route = useRoute();
const { t } = useI18n();

const product = ref(null);

onMounted(async () => {
  // Fetch product
  const id = route.params.id;
  product.value = await fetchProduct(id);
});
</script>

<template>
  <v-container fluid>
    <!-- Breadcrumb: Products > Product Name -->
    <h-bread></h-bread>
    
    <!-- Product details -->
    <v-row v-if="product">
      <v-col cols="12" md="6">
        <v-img :src="product.image"></v-img>
      </v-col>
      <v-col cols="12" md="6">
        <h2>{{ product.name }}</h2>
        <p>{{ product.description }}</p>
        <div class="text-h4">${{ product.price }}</div>
        <v-btn color="primary">{{ t("product.add_to_cart") }}</v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>
```

```typescript
// BreadCrumbs.vue - buildBreadcrumbs() for product detail
if (route.name === 'product_detail') {
  // Fetch product name for breadcrumb
  const productId = route.params.id as string;
  const product = await fetchProduct(productId);
  
  items.value = [
    {
      title: t("menu.products"),
      disabled: false,
      href: "/products"
    },
    {
      title: product.name,  // Dynamic product name
      disabled: true
    }
  ];
}
```

**Result:** User sees breadcrumb `Products > iPhone 15 Pro` and can click `Products` to go back to the product list.
