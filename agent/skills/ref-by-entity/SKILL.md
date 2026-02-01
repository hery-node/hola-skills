---
name: ref-by-entity
description: Implement context-aware reference filtering in Hola Meta Framework. Use when different entities need different subsets of reference options (e.g., Order form shows only active products, Inventory form shows only in-stock products). Triggers on ref_filter, ref_by_entity, or context-specific dropdown filtering.
---

# Context-Aware Reference Filtering

Filter reference dropdown options based on which entity is requesting them.

## Use Case

When entity A has a reference field to entity B, different callers may need different subsets:
- **Order** form → only active products
- **Inventory** form → only in-stock products
- **Other** forms → all products

## Implementation

### 1. Define ref_filter in the Referenced Entity

```typescript
// product.ts (the referenced entity)
import { init_router } from "hola-server";

export const router = init_router({
  collection: "product",
  ref_label: "name",
  
  ref_filter: {
    "order": { status: "active" },      // Filter for Order entity
    "inventory": { in_stock: true },    // Filter for Inventory entity
    "*": {}                             // Default: no filter
  },
  
  fields: [
    { name: "name", type: "string", required: true },
    { name: "status", type: "string" },
    { name: "in_stock", type: "boolean" },
  ],
});
```

### 2. Client Passes ref_by_entity Parameter

When fetching reference labels, the client includes the requesting entity:

```
GET /product/ref?ref_by_entity=order
```

### 3. Server Applies Context-Specific Filter

The `apply_ref_filter` function in `entity.ts`:

```typescript
const apply_ref_filter = (query, ref_filter, ref_by_entity) => {
  if (!ref_filter) return query;
  const filter = ref_filter[ref_by_entity] || ref_filter["*"] || {};
  return { ...query, ...filter };
};
```

## ref_filter Patterns

| Pattern | Example | Use Case |
|---------|---------|----------|
| Entity-specific | `"order": { status: "active" }` | Show only active products to Order |
| Wildcard fallback | `"*": { deleted: false }` | Default filter for unlisted entities |
| No filter | `"*": {}` | Show all records to unlisted entities |

## Client Usage (hola-web)

### API Function

```typescript
// axios.ts
export const getRefLabels = async (entity: string, refByEntity: string, query?: string) => {
  const url = "/" + entity + "/ref";
  const result = await axiosGet(url, { ref_by_entity: refByEntity, query });
  return result.data ?? [];
};
```

### Vue Form Example

```vue
<template>
  <v-autocomplete
    v-model="form.product_id"
    :items="productOptions"
    item-title="title"
    item-value="value"
    label="Product"
  />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getRefLabels } from '@/core/axios';

const form = ref({ product_id: null });
const productOptions = ref([]);

onMounted(async () => {
  // Pass "order" as ref_by_entity to get filtered products
  productOptions.value = await getRefLabels('product', 'order');
});
</script>
```

## Flow Summary

1. Client: `GET /product/ref?ref_by_entity=order`
2. Server: Looks up `ref_filter["order"]` → `{ status: "active" }`
3. Query becomes: `{ ...baseQuery, status: "active" }`
4. Only active products returned for Order's dropdown
