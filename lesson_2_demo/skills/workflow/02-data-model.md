# Stage 2: Data Model Design

## Objective

Design detailed metadata schemas for each entity:

- **Reuse hola's type system** (primary approach)
- Define **custom types** only when necessary
- Configure **field visibility** (create, list, search, update)
- Plan **multi-view strategies** for different contexts

## Core Principle: Reuse Built-in Types

**Always check hola's built-in types first** before creating custom ones.

### Built-in Types Reference

| Type       | Description     | Validation      | Example               |
| ---------- | --------------- | --------------- | --------------------- |
| `string`   | Text data       | Any string      | "John Doe"            |
| `number`   | Numeric values  | Any number      | 42, 3.14              |
| `boolean`  | True/false      | true/false      | true                  |
| `date`     | Date/time       | ISO date string | "2025-01-16"          |
| `email`    | Email address   | RFC 5322 format | "user@example.com"    |
| `phone`    | Phone number    | E.164 format    | "+12025551234"        |
| `url`      | Web address     | Valid URL       | "https://example.com" |
| `array`    | List of values  | Array type      | ["a", "b", "c"]       |
| `obj`      | Nested object   | JSON object     | {x: 1, y: 2}          |
| `json`     | JSON data       | Valid JSON      | {"key": "value"}      |
| `password` | Hashed password | Auto-hashed     | (hashed)              |

**Check `hola-server/src/core/type.ts` for complete list and validation rules.**

### When to Create Custom Types

Create custom types for:

1. **Enumerations** (status, category, priority)
2. **Domain-specific validation** (SKU format, ISBN)
3. **Custom UI components** (color picker, rating)

**Example Custom Type**:

```javascript
// server/src/core/type.ts
import { register_type, int_enum_type, register_schema_type } from "hola-server";
import { t } from "elysia";

// Method 1: Use built-in helper (recommended)
register_type(int_enum_type("task_status", [0, 1, 2, 3]));
// 0=Pending, 1=In Progress, 2=Completed, 3=Cancelled

// Register schema type for request validation
register_schema_type("task_status", () => t.Union([t.Literal(0), t.Literal(1), t.Literal(2), t.Literal(3)]));

// Method 2: Custom convert function (for complex logic)
import { register_type, ok, err, is_int } from "hola-server";

register_type({
  name: "task_status",
  convert: (value) => {
    if (!is_int(value)) return err("task_status", value);
    const int_val = parseInt(String(value));
    const valid = [0, 1, 2, 3];
    return valid.includes(int_val) ? ok(int_val) : err("task_status", value);
  },
});
```

> **IMPORTANT**: Custom types must be registered BEFORE router imports. See [type.md](../../../hola-server/skills/type.md) for initialization order.

## Field Visibility Strategy

**Think deeply about each field's visibility** across different contexts:

| Attribute | When True            | Use Case                                                               |
| --------- | -------------------- | ---------------------------------------------------------------------- |
| `create`  | Show in create form  | User inputs this when creating                                         |
| `list`    | Show in table view   | Important for overview (**Note**: long text should use expand instead) |
| `search`  | Show in search form  | Users filter by this (set `false` for long text)                       |
| `update`  | Allow in edit form   | User can modify this                                                   |
| `clone`   | Include when cloning | Copy to new record                                                     |
| `sys`     | Server-side only     | Calculated/internal fields                                             |
| `secure`  | Hidden from client   | Passwords, secrets                                                     |

### Visibility Decision Tree

```
Is this field user-provided or system-generated?
├─ User-provided
│  ├─ create: true (usually)
│  ├─ update: true (if editable)
│  ├─ list: true (if important for overview)
│  └─ search: true (if filterable)
│
└─ System-generated
   ├─ sys: true (if internal only)
   ├─ create: false
   ├─ update: false
   ├─ list: true (if user needs to see it)
   └─ search: true (if filterable)
```

### Example: E-commerce Product

```javascript
{
  collection: "product",
  primary_keys: ["sku"],
  fields: [
    // User creates/edits, shows in list/search
    { name: "sku", type: "string", required: true, update: false },
    { name: "name", type: "string", required: true },
    // Long text - use expand feature on client to display (list: false, search: false)
    { name: "description", type: "string", create: true, update: true, list: false, search: false },

    // Shows in list/search, user edits
    { name: "price", type: "number", required: true, search: true, list: true },
    { name: "category", type: "string", ref: "category", search: true },

    // System-generated, shows in list
    { name: "stock", type: "number", default: 0, list: true, update: true },
    { name: "sold", type: "number", default: 0, sys: true, list: true, create: false },

    // Long content - use expand feature on client to display
    { name: "specifications", type: "object", create: true, update: true, list: false, search: false },

    // System fields - auto-generated
    { name: "createdAt", type: "date", sys: true, list: true, search: true },
    { name: "updatedAt", type: "date", sys: true }
  ]
}
```

## Long Text Fields and Display Strategy

**IMPORTANT**: Long text fields that need to be displayed to users should use the **expand feature** on the client, not the `list` column.

### Fields That Should Use Expand

| Field Type       | Server Config                          | Client Display |
| ---------------- | -------------------------------------- | -------------- |
| `description`    | `list: false, search: false`           | Use expand     |
| `content`        | `list: false, search: false`           | Use expand     |
| `notes`          | `list: false, search: false`           | Use expand     |
| `specifications` | `list: false, search: false`           | Use expand     |
| `bio`            | `list: false, search: false`           | Use expand     |
| `address`        | `list: false, search: false` (if long) | Use expand     |

### Why Not Use `list: true` for Long Text?

- Disrupts table column widths
- Makes table difficult to scan
- Poor mobile experience
- Content gets truncated anyway

### Client Implementation

**Use table structure for elegant expand field presentation:**

```vue
<!-- Client: ProductView.vue -->
<script setup>
import { useI18n } from "vue-i18n";
const { t } = useI18n();

// Fields to show in expanded row (excluded from main table columns)
const expandFields = ["description", "specifications"];

// Use table structure to organize expand fields elegantly
const headers = [
  {
    name: "description",
    expand: (item) => `
      <tr>
        <td class="text-subtitle-2" style="width: 150px">${t("product.description")}</td>
        <td>${item.description || "-"}</td>
      </tr>
    `,
  },
  {
    name: "specifications",
    expand: (item) => `
      <tr>
        <td class="text-subtitle-2" style="width: 150px">${t("product.specifications")}</td>
        <td>${item.specifications ? JSON.stringify(item.specifications, null, 2) : "-"}</td>
      </tr>
    `,
  },
];
</script>

<template>
  <!-- Expand fields are wrapped in a table automatically for elegant layout -->
  <h-crud :entity="entity" :expand-fields="expandFields" :headers="headers" />
</template>
```

**Key points:**

- Each expand field returns `<tr><td>...</td></tr>` elements
- They are automatically wrapped in a `<table>` for elegant presentation
- Use consistent width for label column (`style="width: 150px"`)
- Use `text-subtitle-2` class for labels to distinguish from values

**See [04-client.md](04-client.md) for complete expand implementation examples.**

## Multi-View Strategy

Use the `view` attribute to show different fields in different contexts.

### View Attribute Values

- `view: "*"` - Show in all views (default)
- `view: "default"` - Show only in default create/edit forms
- `view: "quick"` - Show only in quick-add forms
- `view: "admin"` - Show only in admin forms

### Example: User Entity with Multiple Views

```javascript
{
  collection: "user",
  primary_keys: ["email"],
  fields: [
    // All views
    { name: "email", type: "email", required: true, view: "*" },
    { name: "name", type: "string", required: true, view: "*" },

    // Default view only (full registration)
    { name: "phone", type: "phone", view: "default" },
    { name: "address", type: "string", view: "default", search: false },
    { name: "bio", type: "string", view: "default", search: false },

    // Quick view (rapid signup)
    { name: "password", type: "password", required: true, view: "quick" },

    // Admin view only
    { name: "role", type: "user_role", view: "admin", default: "user" },
    { name: "status", type: "user_status", view: "admin", default: "active" },
    { name: "verified", type: "boolean", view: "admin", sys: true }
  ]
}
```

**Client Usage**:

```vue
<!-- Default registration form -->
<h-crud entity="user" mode="c" createView="default" />

<!-- Quick signup form -->
<h-crud entity="user" mode="c" createView="quick" />

<!-- Admin user management -->
<h-crud entity="user" mode="crud" createView="admin" updateView="admin" />
```

## Reference Fields

### One-to-One Reference

```javascript
{
  name: "category",
  type: "string",     // Single value
  ref: "category",    // Reference to category collection
  delete: "keep"      // When category deleted, keep this field
}
```

### One-to-Many Reference

```javascript
{
  name: "tags",
  type: "array",      // Multiple values
  ref: "tag",         // Reference to tag collection
  delete: "cascade"   // When product deleted, delete all tags
}
```

### Link Fields (Denormalized References)

```javascript
{
  // Reference field
  { name: "category", type: "string", ref: "category" },

  // Linked field (auto-populated from category.name)
  { name: "categoryName", type: "string", link: "category", sys: true }
}
```

## System Fields

**Always include these standard fields**:

```javascript
// Auto-managed by hola framework
{ name: "createdAt", type: "date", sys: true, list: true, search: true },
{ name: "updatedAt", type: "date", sys: true },
{ name: "createdBy", type: "string", ref: "user", sys: true },
{ name: "updatedBy", type: "string", ref: "user", sys: true }
```

## Required vs Default

**Use `required: true` when**:

- User MUST provide the value
- No reasonable default exists
- Critical for business logic

**Use `default: value` when**:

- Reasonable default exists
- Optional field with common value
- System-calculated initial state

```javascript
// Required (user must provide)
{ name: "productName", type: "string", required: true },

// Default (optional with fallback)
{ name: "status", type: "product_status", default: 0 },  // 0 = DRAFT
{ name: "stock", type: "number", default: 0 },
{ name: "featured", type: "boolean", default: false }
```

## Complete Example: Blog Post

```javascript
import { init_router } from "hola-server";

module.exports = init_router({
  collection: "post",
  primary_keys: ["slug"],
  ref_label: "title", // Show title when referenced

  fields: [
    // Identifiers
    { name: "slug", type: "string", required: true, update: false },
    { name: "title", type: "string", required: true },

    // Long text - use expand feature on client (list: false, search: false)
    { name: "content", type: "string", required: true, create: true, update: true, list: false, search: false },
    { name: "excerpt", type: "string", create: true, update: true, list: true },

    // Metadata
    { name: "author", type: "string", ref: "user", required: true, sys: true },
    { name: "category", type: "string", ref: "category", search: true, list: true },
    { name: "tags", type: "array", ref: "tag", list: false },

    // Status workflow
    { name: "status", type: "post_status", default: 0, search: true, list: true },
    // 0: DRAFT, 1: PUBLISHED, 2: ARCHIVED

    // Publishing
    { name: "publishedAt", type: "date", search: true, list: true },
    { name: "featured", type: "boolean", default: false, list: true },

    // Engagement (system-calculated)
    { name: "viewCount", type: "number", default: 0, sys: true, list: true },
    { name: "commentCount", type: "number", default: 0, sys: true, list: true },

    // System fields
    { name: "createdAt", type: "date", sys: true, list: true, search: true },
    { name: "updatedAt", type: "date", sys: true },
  ],

  creatable: true,
  readable: true,
  updatable: true,
  deleteable: true,
});
```

## Field Design Checklist

For each field, ask:

- [ ] Can I use a built-in type? (string, number, email, etc.)
- [ ] Should this be user-created or system-generated?
- [ ] Should it appear in the create form?
- [ ] Should it appear in the list/table view?
- [ ] Should users be able to search/filter by it?
- [ ] Should it be editable after creation?
- [ ] Is a default value appropriate?
- [ ] Does it reference another entity?
- [ ] Should it use a specific view context?

## Common Field Patterns

### Status Workflow

```javascript
{ name: "status", type: "order_status", default: 0, required: true, list: true, search: true }
```

### User Ownership

```javascript
{ name: "owner", type: "string", ref: "user", sys: true, required: true }
```

### Soft Delete

```javascript
{ name: "deleted", type: "boolean", default: false, sys: true }
```

### Timestamps

```javascript
{ name: "createdAt", type: "date", sys: true, list: true, search: true },
{ name: "updatedAt", type: "date", sys: true }
```

### Denormalized Data

```javascript
{ name: "authorName", type: "string", link: "author", sys: true }
```

## Next Step

Proceed to **[03-server.md](03-server.md)** to implement the server-side routers with hola's built-in methods.
