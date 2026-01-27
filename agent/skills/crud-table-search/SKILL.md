---
name: crud-table-search
description: Control which fields are searchable in CRUD tables. Use when the user asks to add/remove search fields, make fields searchable, or configure the search box in data tables.
---

# CRUD Table Search (Searchable Fields)

Control which fields are searchable in CRUD data tables.

## When to Use This Skill

- User asks to **make a field searchable**
- User wants to **add/remove fields from search box**
- User needs to **hide a field from search** while keeping it in the table
- User wants to configure **which fields users can filter by**

## Quick Answer

**To control which fields are searchable, set `search` property in the server entity definition:**

```javascript
// hola-server/router/[entity].ts
{ name: "fieldName", type: "string", search: true }   // ✅ Searchable
{ name: "fieldName", type: "string", search: false }  // ❌ Not searchable
```

## Step-by-Step Instructions

### Step 1: Locate the Entity Definition

Find the entity file in `hola-server/router/[entity].ts`

**Example:** For a `user` entity, open `hola-server/router/user.ts`

### Step 2: Find the Field Definition

Locate the field you want to make searchable/non-searchable:

```javascript
module.exports = init_router({
  collection: "user",
  fields: [
    { name: "name", type: "string" },
    { name: "email", type: "email" },
    { name: "bio", type: "text" }  // ← This field
  ]
});
```

### Step 3: Set the `search` Property

Add or modify the `search` property:

**To make field SEARCHABLE:**
```javascript
{ name: "email", type: "email", search: true }
// Or omit `search` since default is true:
{ name: "email", type: "email" }
```

**To make field NOT SEARCHABLE:**
```javascript
{ name: "bio", type: "text", search: false }
```

### Step 4: Restart the Server

Changes to entity definitions require a server restart:

```bash
# In hola-server directory
bun run dev
```

## Common Patterns

### Pattern 1: Searchable User Identifiers

Make key identifier fields searchable so users can find records:

```javascript
fields: [
  // ✅ Searchable - users need to find by these
  { name: "name", type: "string", search: true },
  { name: "email", type: "email", search: true },
  { name: "phone", type: "phone", search: true },
  { name: "username", type: "string", search: true }
]
```

### Pattern 2: Non-Searchable Long Text

Hide long text fields from search (they clutter the search form):

```javascript
// ❌ BAD - Long text in search form is confusing
{ name: "description", type: "text", search: true }

// ✅ GOOD - Hide from search
{ name: "description", type: "text", search: false, list: false }
```

### Pattern 3: Non-Searchable System Fields

Hide system-generated fields from search:

```javascript
{ name: "_id", type: "objectid", sys: true, search: false },
{ name: "createdAt", type: "date", sys: true, search: false },
{ name: "updatedAt", type: "date", sys: true, search: false },
{ name: "createdBy", type: "ref:user", sys: true, search: false }
```

### Pattern 4: Searchable Enum/Status Fields

Make status and category fields searchable for filtering:

```javascript
{ name: "status", type: "order_status", search: true },
{ name: "category", type: "product_category", search: true },
{ name: "priority", type: "task_priority", search: true },
{ name: "role", type: "user_role", search: true }
```

### Pattern 5: Different Visibility for List vs Search

You can control table columns and search fields independently:

```javascript
fields: [
  // Show in table AND search
  { name: "name", type: "string", list: true, search: true },
  
  // Show in table but NOT searchable
  { name: "createdAt", type: "date", list: true, search: false },
  
  // Searchable but NOT in table
  { name: "tags", type: "array:string", list: false, search: true },
  
  // Hide from BOTH table and search
  { name: "internalNotes", type: "text", list: false, search: false }
]
```

## Search Field Behavior

### How Search Works

When `search: true`, the field appears in the search form:

1. **String fields** → Text input with contains/equals matching
2. **Enum fields** → Dropdown selector
3. **Number fields** → Number input with range operators (>, <, =)
4. **Date fields** → Date picker with range selection
5. **Boolean fields** → Checkbox or toggle
6. **Reference fields** → Autocomplete picker

### Search Form Layout

The CRUD table automatically generates a search form with all `search: true` fields:

```vue
<!-- Automatic search form based on metadata -->
<h-crud entity="product">
  <!-- Search form shows: name, sku, category, status -->
  <!-- (All fields where search: true) -->
</h-crud>
```

## Important Notes

### 1. Default is `true`

If you don't specify `search`, the default is `true`, meaning the field **WILL** be searchable.

```javascript
{ name: "name", type: "string" }  // ← search defaults to true
```

### 2. Server Authority

The `search` property is set **server-side**. The client can restrict searchable fields using the `searchFields` prop, but **cannot make non-searchable fields searchable**.

### 3. Performance Considerations

- **Too many searchable fields** can make the search form cluttered
- **Limit to 5-8 search fields** for best UX
- Consider database indexes for frequently searched fields

## Troubleshooting

### Problem: Field still appears in search after setting `search: false`

**Solution:** Restart the server. Entity metadata is cached on startup.

```bash
cd hola-server
bun run dev
```

### Problem: Need fewer search fields on client without changing server

**Solution:** Use the `searchFields` prop to restrict search fields:

```vue
<!-- hola-web/src/views/ProductView.vue -->
<h-crud
  entity="product"
  :search-fields="['name', 'sku', 'status']">
  <!-- Only these 3 fields in search form, even if more are search:true -->
</h-crud>
```

**Note:** This only works for fields where `search: true` on server.

### Problem: Search form is too crowded

**Solution:** Follow the 5-8 field rule. Hide less-used search fields:

1. Identify the 5-8 **most commonly used** search criteria
2. Set `search: false` for rarely used fields
3. Keep key identifiers (name, email, ID) and filters (status, category) searchable

## Quick Reference

| Task | Code |
|------|------|
| Make field searchable | `search: true` or omit (default) |
| Hide field from search | `search: false` |
| Searchable identifier | `{ name: "email", type: "email", search: true }` |
| Hide long text | `{ name: "notes", type: "text", search: false }` |
| Hide system field | `{ name: "_id", type: "objectid", search: false }` |
| Searchable status | `{ name: "status", type: "order_status", search: true }` |

## Related Skills

- **crud-table-list** - Control which fields show as table columns
- **crud-expand-panel** - Display long text in expand panels
- **crud-create-router** - Customize create forms with complex workflows

## Example: Complete Order Entity

```javascript
// hola-server/router/order.ts
module.exports = init_router({
  collection: "order",
  creatable: true,
  readable: true,
  updatable: true,
  deleteable: true,
  
  fields: [
    // Searchable identifiers (list: true, search: true)
    { name: "orderNumber", type: "string", required: true, list: true, search: true },
    { name: "customerName", type: "string", required: true, list: true, search: true },
    { name: "customerEmail", type: "email", list: true, search: true },
    
    // Searchable filters (list: true, search: true)
    { name: "status", type: "order_status", list: true, search: true },
    { name: "paymentMethod", type: "payment_method", list: true, search: true },
    
    // Non-searchable values (list: true, search: false)
    { name: "totalAmount", type: "number", list: true, search: false },
    { name: "createdAt", type: "date", sys: true, list: true, search: false },
    
    // Hidden from both table and search (list: false, search: false)
    { name: "shippingAddress", type: "text", list: false, search: false },
    { name: "orderNotes", type: "text", list: false, search: false },
    { name: "internalNotes", type: "text", list: false, search: false }
  ]
});
```

**Result:** Clean search form with 5 fields (orderNumber, customerName, customerEmail, status, paymentMethod), making it easy to find orders without cluttering the UI.
