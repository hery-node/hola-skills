---
name: crud-row-click
description: Navigate to detail view on data table row click or double-click. Use when users need to click/double-click table rows to view item details, such as marketplace skill details or order details.
---

# CRUD Row Click Navigation

Navigate to a detail view when user clicks or double-clicks a row in the data table.

## When to Use This Skill

- User wants to **click a row** to view item details
- User needs **double-click navigation** to detail pages
- Building **marketplace** or **catalog** views with detail pages
- Implementing **master-detail** pattern in CRUD tables

## Quick Answer

**Use `@dblclick:row` event to navigate to detail view:**

```vue
<script setup lang="ts">
import { useRouter } from "vue-router";

interface MyEntity {
  _id: string;
  name: string;
}

const router = useRouter();

const onRowDblClick = (_evt: Event, obj: { item: MyEntity }) => {
  router.push(`/entity/${obj.item._id}`);
};
</script>

<template>
  <h-crud entity="my_entity" @dblclick:row="onRowDblClick"> </h-crud>
</template>
```

## Step-by-Step Instructions

### Step 1: Define the Entity Type

Create a TypeScript interface for your entity:

```typescript
interface Skill {
  _id: string;
  name: string;
  description?: string;
  is_public?: boolean;
}
```

### Step 2: Create Event Handler

```typescript
import { useRouter } from "vue-router";

const router = useRouter();

const onRowDblClick = (_evt: Event, obj: { item: Skill }) => {
  const item = obj.item;
  router.push(`/skill/${item._id}`);
};
```

**Event handler parameters:**

- `_evt`: The native DOM event (usually unused, prefix with `_`)
- `obj.item`: The row's data object containing all entity fields

### Step 3: Bind to h-crud

```vue
<h-crud entity="skill" @dblclick:row="onRowDblClick">
</h-crud>
```

### Step 4: Create Detail Route

Ensure you have a route defined for the detail view:

```typescript
// router/index.ts
{
  path: '/skill/:id',
  name: 'skill-detail',
  component: () => import('@/views/SkillDetailView.vue')
}
```

## Common Patterns

### Pattern 1: Marketplace with Detail View

```vue
<script setup lang="ts">
import { useRouter } from "vue-router";

interface Skill {
  _id: string;
  name: string;
}

const router = useRouter();
const entity = "skill";

const onRowDblClick = (_evt: Event, obj: { item: Skill }) => {
  router.push(`/skill/${obj.item._id}`);
};
</script>

<template>
  <v-container fluid>
    <h-bread />

    <h-crud
      :entity="entity"
      list-action="/market"
      mode="rs"
      @dblclick:row="onRowDblClick"
    >
    </h-crud>
  </v-container>
</template>
```

### Pattern 2: Single Click (Alternative)

Use `@click:row` for single-click navigation:

```vue
<h-crud entity="skill" @click:row="onRowClick">
</h-crud>
```

**Note:** Single-click may conflict with row selection. Double-click is recommended for navigation.

### Pattern 3: Conditional Navigation

Navigate based on item properties:

```typescript
const onRowDblClick = (_evt: Event, obj: { item: Skill }) => {
  const item = obj.item;

  if (item.is_public) {
    router.push(`/skill/${item._id}/public`);
  } else {
    router.push(`/skill/${item._id}/edit`);
  }
};
```

### Pattern 4: Admin vs User Routes

```typescript
import { useAuthStore } from "@/stores/auth";

const auth = useAuthStore();

const onRowDblClick = (_evt: Event, obj: { item: Skill }) => {
  const item = obj.item;
  const basePath = auth.isAdmin ? "/admin/skill" : "/skill";
  router.push(`${basePath}/${item._id}`);
};
```

### Pattern 5: Query Parameters

Pass additional context via query params:

```typescript
const onRowDblClick = (_evt: Event, obj: { item: Skill }) => {
  router.push({
    path: `/skill/${obj.item._id}`,
    query: { source: "marketplace" },
  });
};
```

## Complete Example: Skill Marketplace

```vue
<!-- views/SkillMarketView.vue -->
<script setup lang="ts">
import { useRouter } from "vue-router";

interface Skill {
  _id: string;
  name: string;
  category: string;
  description: string;
}

const router = useRouter();
const entity = "skill";
const itemLabelKey = "name";
const sortKey = "created_at";
const sortDesc = true;
const searchCols = 6;

const headers = [{ name: "name" }, { name: "category", chip: true }];

const expandFields = ["description"];

const onRowDblClick = (_evt: Event, obj: { item: Skill }) => {
  router.push(`/skill/${obj.item._id}`);
};
</script>

<template>
  <v-container fluid>
    <h-bread />

    <h-crud
      ref="crudRef"
      :entity="entity"
      list-action="/market"
      :item-label-key="itemLabelKey"
      :sort-key="sortKey"
      :sort-desc="sortDesc"
      :search-cols="searchCols"
      :headers="headers"
      :expand-fields="expandFields"
      mode="rs"
      @dblclick:row="onRowDblClick"
    >
    </h-crud>
  </v-container>
</template>
```

## Available Events

| Event           | Trigger      | Use Case                  |
| --------------- | ------------ | ------------------------- |
| `@click:row`    | Single click | Quick preview, selection  |
| `@dblclick:row` | Double click | Navigation to detail view |

## Event Handler Signature

```typescript
(event: Event, obj: { item: T }) => void
```

- **`event`**: Native DOM event
- **`obj.item`**: The row's entity data (typed as `T`)

## Quick Reference

| Task                 | Code                                              |
| -------------------- | ------------------------------------------------- |
| Double-click handler | `@dblclick:row="onRowDblClick"`                   |
| Single-click handler | `@click:row="onRowClick"`                         |
| Navigate to detail   | `router.push(\`/entity/\${item.\_id}\`)`          |
| Access item data     | `obj.item._id`, `obj.item.name`                   |
| Named route          | `router.push({ name: 'detail', params: { id } })` |

## Related Skills

- **crud-custom-list-endpoint** - Custom list endpoints for marketplaces
- **crud-table-list** - Control column visibility
- **crud-expand-panel** - Show details in expandable rows
