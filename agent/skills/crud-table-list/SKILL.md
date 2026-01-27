---
name: crud-table-list
description: Control which fields display as columns in CRUD tables. Use when the user asks to show/hide fields in the table, add/remove table columns, or configure field visibility in data lists.
---

# CRUD Table List (Column Visibility)

Control which fields display as columns in CRUD data tables.

## When to Use This Skill

- User asks to **show/hide fields** in a table
- User wants to **add/remove columns** from a data list
- User needs to configure **which fields are visible** in table view
- User wants to **clean up** a cluttered table

## Quick Answer

**To control which fields show as table columns, set `list` property in the server entity definition:**

```javascript
// hola-server/router/[entity].ts
{ name: "fieldName", type: "string", list: true }   // ✅ Shows in table
{ name: "fieldName", type: "string", list: false }  // ❌ Hidden from table
```

## Step-by-Step Instructions

### Step 1: Locate the Entity Definition

Find the entity file in `hola-server/router/[entity].ts`

**Example:** For a `product` entity, open `hola-server/router/product.ts`

### Step 2: Find the Field Definition

Locate the field you want to show/hide in the `fields` array:

```javascript
module.exports = init_router({
  collection: "product",
  fields: [
    { name: "name", type: "string", required: true },
    { name: "description", type: "text" },
    { name: "price", type: "number" },
    { name: "internalNotes", type: "text" }  // ← This field
  ]
});
```

### Step 3: Set the `list` Property

Add or modify the `list` property:

**To HIDE a field from table:**
```javascript
{ name: "internalNotes", type: "text", list: false }
```

**To SHOW a field in table:**
```javascript
{ name: "price", type: "number", list: true }
// Or omit `list` since default is true:
{ name: "price", type: "number" }
```

### Step 4: Restart the Server

Changes to entity definitions require a server restart:

```bash
# In hola-server directory
bun run dev
```

## Common Patterns

### Pattern 1: Hide Long Text Fields

Long text should NOT be shown in table columns. Use expand panels instead (see `crud-expand-panel` skill).

```javascript
// ❌ BAD - Shows long text in table
{ name: "description", type: "text", list: true }

// ✅ GOOD - Hide from table, show in expand panel
{ name: "description", type: "text", list: false }
```

### Pattern 2: Hide Sensitive/Internal Fields

```javascript
// Hide password, internal IDs, system fields from table
{ name: "password", type: "password", list: false, search: false },
{ name: "internalNotes", type: "text", list: false },
{ name: "_id", type: "objectid", sys: true, list: false }
```

### Pattern 3: Show Key Identifier Fields

```javascript
// Always show key fields that users need to identify records
{ name: "name", type: "string", list: true },
{ name: "email", type: "email", list: true },
{ name: "orderNumber", type: "string", list: true },
{ name: "status", type: "order_status", list: true }
```

### Pattern 4: Clean Minimal Table

For a clean table, only show 4-6 most important fields:

```javascript
fields: [
  // ✅ Show in table (4-6 key fields)
  { name: "name", type: "string", list: true },
  { name: "email", type: "email", list: true },
  { name: "role", type: "user_role", list: true },
  { name: "status", type: "user_status", list: true },
  
  // ❌ Hide from table (still available in forms and expand panels)
  { name: "phone", type: "phone", list: false },
  { name: "address", type: "string", list: false },
  { name: "bio", type: "text", list: false },
  { name: "notes", type: "text", list: false }
]
```

## Important Notes

### 1. Default is `true`

If you don't specify `list`, the default is `true`, meaning the field **WILL** show in the table.

```javascript
{ name: "name", type: "string" }  // ← list defaults to true
```

### 2. Client Cannot Override

The `list` property is set **server-side** and defines the **maximum** fields that can be shown. The client can hide additional fields using the `headers` prop, but **cannot show fields marked `list: false` on the server**.

### 3. Separate from Search

The `list` property only controls **table columns**. To control search fields, use the `search` property (see `crud-table-search` skill).

```javascript
{ name: "email", type: "email", list: true, search: true }   // In table AND search
{ name: "bio", type: "text", list: false, search: false }   // Hidden from both
{ name: "createdAt", type: "date", list: true, search: false }  // In table but NOT searchable
```

## Troubleshooting

### Problem: Field still shows in table after setting `list: false`

**Solution:** Restart the server. Entity metadata is cached on startup.

```bash
cd hola-server
bun run dev
```

### Problem: Need to hide field from client without changing server

**Solution:** Use the `headers` prop in the client to customize visible columns:

```vue
<!-- hola-web/src/views/ProductView.vue -->
<h-crud
  entity="product"
  :headers="[
    { key: 'name', title: 'Name' },
    { key: 'price', title: 'Price' }
    <!-- Omit other fields to hide them -->
  ]">
</h-crud>
```

**Note:** This only works for fields where `list: true` on server. You cannot show fields marked `list: false`.

### Problem: Too many columns, table is cluttered

**Solution:** Follow the 4-6 column rule. Hide less important fields:

1. Identify the 4-6 **most important** fields for identifying records
2. Set `list: false` for all other fields
3. Use expand panels for detailed information (see `crud-expand-panel` skill)

## Quick Reference

| Task | Code |
|------|------|
| Show field in table | `list: true` or omit (default) |
| Hide field from table | `list: false` |
| Hide long text | `{ name: "notes", type: "text", list: false }` |
| Hide sensitive data | `{ name: "password", type: "password", list: false }` |
| Show key fields | `{ name: "email", type: "email", list: true }` |

## Related Skills

- **crud-table-search** - Control which fields are searchable
- **crud-expand-panel** - Display long text in expand panels
- **crud-create-router** - Customize create forms with complex workflows

## Example: Complete Product Entity

```javascript
// hola-server/router/product.ts
module.exports = init_router({
  collection: "product",
  creatable: true,
  readable: true,
  updatable: true,
  deleteable: true,
  
  fields: [
    // Show in table (key identifier fields)
    { name: "name", type: "string", required: true, list: true, search: true },
    { name: "sku", type: "string", required: true, list: true, search: true },
    { name: "price", type: "number", required: true, list: true },
    { name: "stock", type: "number", list: true },
    { name: "status", type: "product_status", list: true, search: true },
    
    // Hide from table (details available in forms/expand panels)
    { name: "description", type: "text", list: false, search: false },
    { name: "specifications", type: "text", list: false, search: false },
    { name: "internalNotes", type: "text", list: false, search: false },
    { name: "supplier", type: "string", list: false },
    
    // System fields (never show in table)
    { name: "createdAt", type: "date", sys: true, list: false },
    { name: "updatedAt", type: "date", sys: true, list: false }
  ]
});
```

**Result:** Clean table with 5 columns (name, sku, price, stock, status), with detailed information available in expand panels.
