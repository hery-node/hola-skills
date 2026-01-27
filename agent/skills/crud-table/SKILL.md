---
name: crud-table
description: Configure and customize CRUD data tables in the Hola meta-programming framework. Use when the user asks to show/hide fields in tables, configure search fields, add expand panels, or work with data lists. CRUD = Create, Read/Refresh, Update, Delete operations.
---

# CRUD Table Configuration

Configure CRUD data tables (`h-crud` component) in the Hola meta-programming framework.

## Trigger Phrases

- "create/add a data table"
- "show/hide fields in table"
- "add field to search"
- "add expand panel"
- "configure CRUD table"
- "data list"

## What is a CRUD Table?

**CRUD** = **C**reate, **R**ead/Refresh, **U**pdate, **D**elete

The CRUD table (`h-crud` component) is the **primary component** for entity management in Hola. It provides:
- ✅ Data table with server-side pagination/infinite scroll
- ✅ Create form dialog
- ✅ Edit form dialog  
- ✅ Delete with confirmation
- ✅ Search functionality
- ✅ Batch operations

**Rule #1:** If you need a data list, **always use the CRUD table first**.

## Entity Property Reference

### Server-Side Entity Configuration

**Location:** `hola-server/router/[entity].ts`

Example: User entity is defined in `router/user.ts`

```javascript
module.exports = init_router({
  collection: "user",
  creatable: true,
  readable: true,
  updatable: true,
  deleteable: true,

  fields: [
    { name: "name", type: "string", required: true, list: true, search: true },
    { name: "email", type: "email", required: true, list: true, search: true },
    { name: "phone", type: "phone", list: false, search: false },
    { name: "bio", type: "text", list: false, search: false }
  ]
});
```

### Field Properties for Display

| Property | Default | Purpose | Example Use Case |
|----------|---------|---------|------------------|
| `list: true` | `true` | Show in table columns | Name, Email, Status |
| `list: false` | - | Hide from table | Password, Long text |
| `search: true` | `true` | Show in search form | Name, Email, Category |
| `search: false` | - | Hide from search | ID, Created date |
| `create: true` | `true` | Show in create form | All user-input fields |
| `update: true` | `true` | Show in edit form | Editable fields |

**Important:** The default value for `list`, `search`, `create`, and `update` is `true`. You only need to set them explicitly when you want `false`.

## Common Operations

### Operation 1: Hide Field from Table

**Request:** "Don't show the phone field in the user table"

**Action:** Set `list: false` in server entity

```javascript
// hola-server/router/user.ts
{ name: "phone", type: "phone", list: false }
```

### Operation 2: Hide Field from Search

**Request:** "Hide the bio field from search box"

**Action:** Set `search: false` in server entity

```javascript
// hola-server/router/user.ts
{ name: "bio", type: "text", search: false }
```

### Operation 3: Show Field in Both Table and Search

**Request:** "Show status field in table and search"

**Action:** Ensure both are `true` (or omit since default is `true`)

```javascript
// hola-server/router/user.ts
{ name: "status", type: "user_status", list: true, search: true }
// Or simply:
{ name: "status", type: "user_status" }  // Both default to true
```

### Operation 4: Make Field Read-Only

**Request:** "Don't allow editing of createdAt field"

**Action:** Set `update: false`

```javascript
// hola-server/router/user.ts
{ name: "createdAt", type: "date", sys: true, update: false }
```

## Expand Panels for Long Text

### Why Use Expand Panels?

Long text fields (description, bio, notes, content) should **NOT** be shown directly in table columns. Instead, use **expand panels** to display them when users click to expand a row.

**Benefits:**
- ✅ Keeps table clean and readable
- ✅ Shows full content without truncation
- ✅ Better UX for long text
- ✅ Maintains table performance

### How to Configure Expand Fields

**Step 1: Server-Side - Mark Field for Expand**

Set `list: false` and `search: false` for long text:

```javascript
// hola-server/router/product.ts
fields: [
  { name: "name", type: "string", required: true },
  { name: "price", type: "currency", required: true },
  { name: "description", type: "text", list: false, search: false },
  { name: "specifications", type: "text", list: false, search: false }
]
```

**Step 2: Client-Side - Define Expand Fields**

**Location:** `hola-web/src/views/[Entity]View.vue`

```vue
<template>
  <h-crud
    entity="product"
    :sort-desc="[true]"
    :sort-key="['createdAt']"
    item-label-key="name"
    mode="bcduprso"
    :expand-fields="expandFields"
    :headers="headers">
  </h-crud>
</template>

<script>
export default {
  data() {
    return {
      expandFields: ["description", "specifications"],
      
      headers: [
        {
          name: "description",
          expand: (item) => `
            <tr>
              <td class="text-subtitle-2">Description:</td>
              <td>${item.description || 'N/A'}</td>
            </tr>
          `
        },
        {
          name: "specifications",
          expand: (item) => `
            <tr>
              <td class="text-subtitle-2">Specifications:</td>
              <td><pre>${JSON.stringify(item.specifications, null, 2)}</pre></td>
            </tr>
          `
        }
      ]
    };
  }
};
</script>
```

### Expand Panel Best Practices

1. **Use Table Structure** - Return `<tr><td>...</td></tr>` for clean layout
2. **Add Labels** - Use `text-subtitle-2` class for field labels
3. **Handle Empty Values** - Use `|| 'N/A'` for missing data
4. **Format Complex Data** - Use `JSON.stringify()` for objects, `<pre>` for readability
5. **HTML-Safe** - Escape user content to prevent XSS

### Common Expand Patterns

```javascript
// Simple text field
{
  name: "description",
  expand: (item) => `
    <tr>
      <td class="text-subtitle-2" width="150px">Description:</td>
      <td>${item.description || 'No description'}</td>
    </tr>
  `
}

// Object/JSON field
{
  name: "metadata",
  expand: (item) => `
    <tr>
      <td class="text-subtitle-2">Metadata:</td>
      <td><pre>${JSON.stringify(item.metadata, null, 2)}</pre></td>
    </tr>
  `
}

// Array field
{
  name: "tags",
  expand: (item) => `
    <tr>
      <td class="text-subtitle-2">Tags:</td>
      <td>${(item.tags || []).join(', ')}</td>
    </tr>
  `
}

// Formatted date
{
  name: "lastModified",
  expand: (item) => `
    <tr>
      <td class="text-subtitle-2">Last Modified:</td>
      <td>${new Date(item.lastModified).toLocaleString()}</td>
    </tr>
  `
}
```

## CRUD Table Modes

### ⚠️ Server Authority vs Client Restriction

**CRITICAL CONCEPT:** CRUD permissions are **defined on the server** and **enforced by the server**. The client can only be **more restrictive**, never more permissive.

### Server-Side Permission Definition

**Location:** `hola-server/router/[entity].ts`

The server defines what operations are **allowed**:

```javascript
module.exports = init_router({
  collection: "product",
  creatable: true,    // Server allows CREATE
  readable: true,     // Server allows READ
  updatable: true,    // Server allows UPDATE
  deleteable: false,  // Server DOES NOT allow DELETE
  
  fields: [...]
});
```

**Server permissions are the MAXIMUM allowed operations.** The API will reject any unauthorized operations regardless of client configuration.

### ⭐ Automatic Mode Detection

**IMPORTANT:** The `mode` property is **automatically obtained from the server** based on the entity's permission settings.

**You only need to specify `mode` on the client when you want to RESTRICT permissions beyond what the server provides.**

**Default behavior (no mode specified):**

```vue
<!-- ✅ Mode is automatically derived from server permissions -->
<h-crud
  entity="product"
  :sort-desc="[true]"
  :sort-key="['createdAt']"
  item-label-key="name">
</h-crud>
```

If server has `creatable: true, readable: true, updatable: true, deleteable: true`, the table will automatically show create, read, update, and delete operations **without specifying mode**.

**When to specify mode:**

- **Creating read-only views** - Override to `mode="rs"` even when server allows full CRUD
- **Hiding specific operations** - Remove delete from UI even when server allows it
- **Different user roles** - Admin view vs user view of same entity

```vue
<!-- Only specify mode when you need to restrict -->
<h-crud
  entity="product"
  mode="rs"      <!-- Override: read-only view -->
  :sort-desc="[true]"
  :sort-key="['createdAt']"
  item-label-key="name">
</h-crud>
```

### Client-Side Mode Configuration (When Overriding)

**Location:** `hola-web/src/views/[Entity]View.vue`

The client `mode` property (when specified) controls which UI elements are shown, but **can only be a subset** of server permissions:

```vue
<h-crud
  entity="product"
  mode="cru"     <!-- Client restricts to Create, Read, Update only -->
  ...>
</h-crud>
```

### Permission Hierarchy Rule

**✅ CORRECT - Client uses subset of server permissions:**

```javascript
// Server: creatable=true, updatable=true, deleteable=false
// Client options:
mode="r"        // ✅ Read-only view (subset)
mode="cru"      // ✅ Create, read, update (subset)
mode="ru"       // ✅ Read and update only (subset)
```

**❌ INCORRECT - Client tries to add permissions server doesn't allow:**

```javascript
// Server: creatable=true, updatable=true, deleteable=false
// Client attempts:
mode="crud"     // ❌ WRONG - Server doesn't allow delete!
mode="crudo"    // ❌ WRONG - Delete not allowed by server
```

**What happens:** The UI will show delete button, but API will return 403 Forbidden error.

### Mode Characters Reference

| Mode Character | Operation | Server Property |
|----------------|-----------|-----------------|
| `c` | Create - Show "Add" button | `creatable: true` |
| `r` | Refresh - Show "Refresh" button | `readable: true` |
| `u` | Update - Show "Edit" action | `updatable: true` |
| `d` | Delete - Show "Delete" action | `deleteable: true` |
| `o` | Clone - Show "Clone" action | `creatable: true` |
| `s` | Search - Show search form | `readable: true` |
| `p` | Pagination - Use pagination instead of infinite scroll | - |
| `b` | Batch - Enable batch operations | - |

### Common Use Cases

**1. Full-Feature CRUD (Server allows everything)**

```javascript
// Server
creatable: true, readable: true, updatable: true, deleteable: true

// Client
mode="bcduprso"  // Everything enabled
mode="cruds"     // Full CRUD with search (recommended)
```

**2. Read-Only View (Server allows CRUD, client restricts)**

```javascript
// Server
creatable: true, readable: true, updatable: true, deleteable: true

// Client
mode="rs"        // Only read and search (read-only view)
```

**3. No Delete Permission (Server restriction)**

```javascript
// Server
creatable: true, readable: true, updatable: true, deleteable: false

// Client
mode="crus"      // Create, read, update, search (no delete)
```

### Best Practice

1. **Always check server entity definition first** - Know what the server allows
2. **Client mode must be subset** - Never exceed server permissions
3. **Use meaningful subsets** - For example, admin views vs user views
4. **Common patterns:**
   - Admin: `mode="cruds"` (full access)
   - User: `mode="rs"` (read-only)
   - Editor: `mode="crus"` (no delete)

## Quick Checklist

When configuring a CRUD table:

1. **Check entity definition** in `hola-server/router/[entity].ts`
2. **Set `list: true/false`** to control table columns
3. **Set `search: true/false`** to control search fields
4. **Mark long text** with `list: false, search: false`
5. **Define expand fields** in client view for long text
6. **Implement expand functions** with table structure

## For More Details

See [references/crud_guide.md](references/crud_guide.md) for:
- Complete `h-crud` component API
- Advanced customization examples
- Filter and sort configurations
- Custom actions and toolbars
