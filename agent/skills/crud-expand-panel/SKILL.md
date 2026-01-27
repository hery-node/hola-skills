---
name: crud-expand-panel
description: Display long text and detailed information in expandable table rows. Use when the user asks to show descriptions, notes, or detailed fields in tables without cluttering columns.
---

# CRUD Expand Panel (Expandable Row Details)

Display long text and detailed information in expandable table rows.

## When to Use This Skill

- User has **long text fields** (description, bio, notes, content)
- User wants to show **detailed information** without cluttering table
- User needs to display **complex data** (JSON, arrays, objects) in tables
- User wants **clean tables** with expandable details

## Quick Answer

**Use expand panels for long text instead of showing them as columns:**

**Step 1:** Hide from table (server-side)
```javascript
// hola-server/router/[entity].ts
{ name: "description", type: "text", list: false, search: false }
```

**Step 2:** Add expand fields (client-side)
```vue
<!-- hola-web/src/views/[Entity]View.vue -->
<h-crud
  entity="product"
  :expand-fields="['description']"
  :headers="headers">
</h-crud>

<script>
export default {
  data() {
    return {
      headers: [{
        name: "description",
        expand: (item) => `
          <tr>
            <td class="text-subtitle-2">Description:</td>
            <td>${item.description || 'N/A'}</td>
          </tr>
        `
      }]
    };
  }
};
</script>
```

## Why Use Expand Panels?

### Problems with Long Text in Columns

❌ **BAD:** Showing long text directly in table columns

```javascript
// Server
{ name: "description", type: "text", list: true }

// Result: Truncated text, cluttered table, poor UX
// Table column shows: "This is a very long descri..."
```

**Issues:**
- Text gets truncated with "..."
- Wastes horizontal space
- Makes table hard to scan
- Users can't see full content
- Table becomes cluttered

### Benefits of Expand Panels

✅ **GOOD:** Using expand panels

```javascript
// Server
{ name: "description", type: "text", list: false }

// Client: Expand panel
// Result: Clean table, click row to see full description
```

**Benefits:**
- ✅ Keeps table clean and scannable
- ✅ Shows full content when needed
- ✅ Better performance (less data rendered)
- ✅ Professional UX
- ✅ Works great for mobile

## Step-by-Step Instructions

### Step 1: Server-Side Configuration

Hide the long text field from table and search:

```javascript
// hola-server/router/product.ts
module.exports = init_router({
  collection: "product",
  fields: [
    // Show in table
    { name: "name", type: "string", required: true, list: true },
    { name: "price", type: "currency", required: true, list: true },
    { name: "status", type: "product_status", list: true },
    
    // Hide from table - use expand panel instead
    { name: "description", type: "text", list: false, search: false },
    { name: "specifications", type: "text", list: false, search: false }
  ]
});
```

### Step 2: Client-Side - Define Expand Fields

**Location:** `hola-web/src/views/ProductView.vue`

```vue
<template>
  <h-crud
    entity="product"
    :sort-desc="[true]"
    :sort-key="['createdAt']"
    item-label-key="name"
    :expand-fields="expandFields"
    :headers="headers">
  </h-crud>
</template>

<script>
export default {
  data() {
    return {
      // List of fields to show in expand panel
      expandFields: ["description", "specifications"],
      
      // Expand functions for each field
      headers: [
        {
          name: "description",
          expand: (item) => `
            <tr>
              <td class="text-subtitle-2" width="150px">Description:</td>
              <td>${item.description || 'No description'}</td>
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

### Step 3: Test the Expand Panel

1. Click on a table row
2. Row expands to show description and specifications
3. Click again to collapse

## Expand Function Patterns

### Pattern 1: Simple Text Field

```javascript
{
  name: "description",
  expand: (item) => `
    <tr>
      <td class="text-subtitle-2" width="150px">Description:</td>
      <td>${item.description || 'No description available'}</td>
    </tr>
  `
}
```

### Pattern 2: Multiline Text (Preserve Line Breaks)

```javascript
{
  name: "notes",
  expand: (item) => `
    <tr>
      <td class="text-subtitle-2">Notes:</td>
      <td><pre style="white-space: pre-wrap;">${item.notes || 'No notes'}</pre></td>
    </tr>
  `
}
```

### Pattern 3: JSON/Object Data

```javascript
{
  name: "metadata",
  expand: (item) => `
    <tr>
      <td class="text-subtitle-2">Metadata:</td>
      <td><pre>${JSON.stringify(item.metadata || {}, null, 2)}</pre></td>
    </tr>
  `
}
```

### Pattern 4: Array Data

```javascript
{
  name: "tags",
  expand: (item) => `
    <tr>
      <td class="text-subtitle-2">Tags:</td>
      <td>${(item.tags || []).join(', ') || 'No tags'}</td>
    </tr>
  `
}
```

### Pattern 5: Formatted Date

```javascript
{
  name: "createdAt",
  expand: (item) => `
    <tr>
      <td class="text-subtitle-2">Created:</td>
      <td>${new Date(item.createdAt).toLocaleString()}</td>
    </tr>
  `
}
```

### Pattern 6: Multiple Fields in One Row

```javascript
{
  name: "userInfo",
  expand: (item) => `
    <tr>
      <td class="text-subtitle-2">Contact Info:</td>
      <td>
        <strong>Email:</strong> ${item.email}<br>
        <strong>Phone:</strong> ${item.phone || 'N/A'}<br>
        <strong>Address:</strong> ${item.address || 'N/A'}
      </td>
    </tr>
  `
}
```

### Pattern 7: HTML Content (Use Carefully)

```javascript
{
  name: "htmlContent",
  expand: (item) => `
    <tr>
      <td class="text-subtitle-2">Content:</td>
      <td>
        <div style="max-height: 300px; overflow-y: auto;">
          ${item.htmlContent || 'No content'}
        </div>
      </td>
    </tr>
  `
}
```

**⚠️ Security Warning:** Always sanitize user-generated HTML to prevent XSS attacks!

## Best Practices

### 1. Use Table Structure

Always use `<tr><td>...</td></tr>` for proper layout:

```javascript
// ✅ GOOD
expand: (item) => `
  <tr>
    <td class="text-subtitle-2">Field:</td>
    <td>${item.value}</td>
  </tr>
`

// ❌ BAD - No table structure
expand: (item) => `<div>${item.value}</div>`
```

### 2. Add Field Labels

Use `text-subtitle-2` class for labels and set width for consistency:

```javascript
expand: (item) => `
  <tr>
    <td class="text-subtitle-2" width="150px">Description:</td>
    <td>${item.description}</td>
  </tr>
`
```

### 3. Handle Missing Data

Always provide fallback for null/undefined values:

```javascript
// ✅ GOOD
${item.description || 'No description'}
${item.tags?.join(', ') || 'No tags'}

// ❌ BAD - Shows "undefined"
${item.description}
```

### 4. Format Complex Data

Use `JSON.stringify()` with `<pre>` for readability:

```javascript
<pre>${JSON.stringify(item.data, null, 2)}</pre>
```

### 5. Limit Expand Fields

Don't overload expand panels. Show 2-5 most important detail fields:

```javascript
// ✅ GOOD - 3 important fields
expandFields: ["description", "specifications", "notes"]

// ❌ BAD - Too many fields, cluttered
expandFields: ["field1", "field2", "field3", "field4", "field5", "field6"]
```

## Common Use Cases

### Use Case 1: Product Details

```javascript
// Server
fields: [
  { name: "name", type: "string", list: true },
  { name: "price", type: "currency", list: true },
  { name: "description", type: "text", list: false },
  { name: "specifications", type: "text", list: false }
]

// Client
expandFields: ["description", "specifications"]
```

### Use Case 2: User Profiles

```javascript
// Server
fields: [
  { name: "name", type: "string", list: true },
  { name: "email", type: "email", list: true },
  { name: "role", type: "user_role", list: true },
  { name: "bio", type: "text", list: false },
  { name: "address", type: "text", list: false }
]

// Client
expandFields: ["bio", "address"]
```

### Use Case 3: Order Details

```javascript
// Server
fields: [
  { name: "orderNumber", type: "string", list: true },
  { name: "status", type: "order_status", list: true },
  { name: "total", type: "currency", list: true },
  { name: "items", type: "array", list: false },
  { name: "shippingAddress", type: "text", list: false },
  { name: "notes", type: "text", list: false }
]

// Client
expandFields: ["items", "shippingAddress", "notes"]

headers: [
  {
    name: "items",
    expand: (item) => `
      <tr>
        <td class="text-subtitle-2">Order Items:</td>
        <td>
          <table>
            ${(item.items || []).map(i => 
              `<tr><td>${i.name}</td><td>x${i.qty}</td><td>$${i.price}</td></tr>`
            ).join('')}
          </table>
        </td>
      </tr>
    `
  }
]
```

## Troubleshooting

### Problem: Expand panel doesn't show

**Check 1:** Is field in `expandFields` array?
```javascript
expandFields: ["description"]  // Must include field name
```

**Check 2:** Is there a matching header with `expand` function?
```javascript
headers: [{
  name: "description",  // Must match expandFields
  expand: (item) => `...`
}]
```

### Problem: Shows "undefined" in expand panel

**Solution:** Add fallback values:
```javascript
${item.description || 'No description'}
${item.tags?.join(', ') || 'No tags'}
```

### Problem: HTML not rendering correctly

**Solution:** Ensure proper table structure:
```javascript
expand: (item) => `
  <tr>
    <td>...</td>
    <td>...</td>
  </tr>
`
```

## Quick Reference

| Task | Code |
|------|------|
| Hide from table | `{ name: "desc", type: "text", list: false }` |
| Add expand field | `expandFields: ["desc"]` |
| Simple text | `<td>${item.desc \|\| 'N/A'}</td>` |
| JSON data | `<td><pre>${JSON.stringify(item.data, null, 2)}</pre></td>` |
| Array | `<td>${(item.tags \|\| []).join(', ')}</td>` |
| Date | `<td>${new Date(item.date).toLocaleString()}</td>` |

## Related Skills

- **crud-table-list** - Control which fields show as table columns
- **crud-table-search** - Control which fields are searchable
- **crud-create-router** - Customize create forms with complex workflows

## Complete Example

```javascript
// hola-server/router/article.ts
module.exports = init_router({
  collection: "article",
  fields: [
    // Table columns
    { name: "title", type: "string", required: true, list: true, search: true },
    { name: "author", type: "string", list: true, search: true },
    { name: "status", type: "article_status", list: true, search: true },
    { name: "publishedAt", type: "date", list: true },
    
    // Expand panel fields
    { name: "summary", type: "text", list: false, search: false },
    { name: "content", type: "text", list: false, search: false },
    { name: "tags", type: "array:string", list: false },
    { name: "metadata", type: "object", list: false }
  ]
});
```

```vue
<!-- hola-web/src/views/ArticleView.vue -->
<template>
  <h-crud
    entity="article"
    item-label-key="title"
    :expand-fields="expandFields"
    :headers="headers">
  </h-crud>
</template>

<script>
export default {
  data() {
    return {
      expandFields: ["summary", "content", "tags", "metadata"],
      
      headers: [
        {
          name: "summary",
          expand: (item) => `
            <tr>
              <td class="text-subtitle-2" width="150px">Summary:</td>
              <td>${item.summary || 'No summary'}</td>
            </tr>
          `
        },
        {
          name: "content",
          expand: (item) => `
            <tr>
              <td class="text-subtitle-2">Content:</td>
              <td>
                <div style="max-height: 200px; overflow-y: auto;">
                  <pre style="white-space: pre-wrap;">${item.content || 'No content'}</pre>
                </div>
              </td>
            </tr>
          `
        },
        {
          name: "tags",
          expand: (item) => `
            <tr>
              <td class="text-subtitle-2">Tags:</td>
              <td>${(item.tags || []).join(', ') || 'No tags'}</td>
            </tr>
          `
        },
        {
          name: "metadata",
          expand: (item) => `
            <tr>
              <td class="text-subtitle-2">Metadata:</td>
              <td><pre>${JSON.stringify(item.metadata || {}, null, 2)}</pre></td>
            </tr>
          `
        }
      ]
    };
  }
};
</script>
```

**Result:** Clean table with 4 columns (title, author, status, publishedAt). Click any row to expand and see summary, full content, tags, and metadata in a well-formatted panel.
