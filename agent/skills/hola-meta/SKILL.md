---
name: hola-meta
description: Define and validate entity metadata in Hola framework. Use when creating entity routers with init_router(), defining field visibility flags (create, update, clone, search, list), setting up sys/user_field protection, configuring role-based access, or understanding field subset filtering.
---

# Hola Meta Framework

Entity metadata definition using `init_router()` for CRUD operations.

## ⚠️ CRITICAL: Initialization Order

If you use custom types in entity fields, you **MUST** register them **BEFORE** importing router files:

```typescript
// main.ts
import { init_settings } from "hola-server";
import { register_types } from "./core/type.js";

// 1. Initialize settings and register types FIRST
init_settings(settings);
register_types();

// 2. Dynamic import routers AFTER types are registered
const userRouter = (await import("./router/user.js")).default;
const orderRouter = (await import("./router/order.js")).default;
```

**Why?** Router files call `init_router()` at import time. If types aren't registered yet, validation fails.

## Allowed Attributes

### Meta-Level Attributes (ONLY these are valid)

**Entity-Level:**

- `collection`, `primary_keys`, `fields` (required)
- `roles`, `ref_label`, `ref_filter`, `user_field`, `route`

**Operation Flags:**

- `creatable`, `readable`, `updatable`, `deleteable`, `cloneable`, `importable`, `exportable`

**Lifecycle Callbacks:**

- `before_create`, `after_create`, `before_update`, `after_update`
- `before_clone`, `after_clone`, `before_delete`, `after_delete`
- `after_read`, `list_query`, `after_batch_update`
- `create`, `clone`, `update`, `batch_update`, `delete` (custom handlers)

> **IMPORTANT**: Any attributes outside this list will cause validation errors.

### Field Attributes (Standard fields)

**ONLY these attributes are allowed:**

- `name`, `type`, `required`, `default`
- `ref`, `link`, `delete`
- `create`, `list`, `search`, `update`, `clone`
- `sys`, `secure`, `group`, `view`

**Link fields ONLY allow:**

- `name`, `link`, `list`

> **IMPORTANT**: Type configuration (like `enum_values`, `max_length`) goes in type definition, NOT in field attributes. See `add-meta-type` skill.

## Quick Start

```typescript
import { init_router } from "hola-server";

export const router = init_router({
  collection: "user",
  primary_keys: ["email"],
  ref_label: "name",
  readable: true,
  creatable: true,
  updatable: true,
  deleteable: true,
  roles: ["admin:*", "user:rs"],

  fields: [
    { name: "email", type: "email", required: true },
    { name: "name", type: "string", required: true },
    { name: "status", type: "user_status", default: 0 },
    { name: "owner", sys: true }, // Server-only, protected from client
    { name: "password", secure: true, create: false, update: false },
  ],
});
```

## Field Visibility Flags

Control field behavior per operation. **Default: true** (explicitly set false to exclude).

| Flag     | Purpose             | Default |
| -------- | ------------------- | ------- |
| `create` | Show in create form | true    |
| `update` | Allow update        | true    |
| `clone`  | Include in clone    | true    |
| `search` | Show in search form | true    |
| `list`   | Show in list view   | true    |

> [!IMPORTANT] **Don't define values that match framework defaults.** Only specify flags to override defaults.
>
> ❌ `{ name: "x", sys: true, list: false, search: false }` — Redundant! `sys:true` already defaults list/search to false ✅ `{ name: "x", sys: true }` — Clean, relies on framework defaults ✅ `{ name: "x", sys: true, list: true }` — Overrides default to show in list

## Protected Fields

### `sys: true` - System Fields

Server-managed fields hidden from client metadata. Automatically enforced:

- `create`, `update`, `clone` → **must be false** (throws error if set to true)
- Client cannot set values, but hooks CAN set them server-side

```typescript
{ name: "created_by", sys: true },  // Auto: create/update/clone = false
```

### `user_field` - Ownership Field

Auto-populated from authenticated user's `sub`. Protected like sys fields:

- `create`, `update`, `clone` → **must be false**
- Set automatically in router before `create_entity()`

```typescript
{
  collection: "task",
  user_field: "owner",  // Auto-set to user.sub
  fields: [{ name: "owner" }],  // Will be protected
}
```

## Default Values

Applied in router **before** `create_entity()` (not in entity.ts):

```typescript
// router.ts - POST / endpoint
for (const field of meta.create_fields) {
  if (!has_value(data[field.name]) && field.default !== undefined) {
    data[field.name] = field.default;
  }
}
```

- Only applied on **create**, not update or clone
- Validated against field type during meta initialization

## Field Subsets

Auto-generated field groups for different contexts:

| Subset            | Filter Logic                           |
| ----------------- | -------------------------------------- |
| `client_fields`   | `sys !== true` (metadata response)     |
| `property_fields` | `secure !== true`                      |
| `create_fields`   | `create !== false`                     |
| `update_fields`   | `create !== false && update !== false` |
| `clone_fields`    | `clone !== false`                      |
| `search_fields`   | `search !== false`                     |
| `list_fields`     | `list !== false && secure !== true`    |

## /meta Endpoint Response

Returns filtered metadata with mode:

```typescript
// Only fields visible in at least one UI context
const visible_fields = meta.client_fields.filter((f) => f.create === true || f.update === true || f.search === true || f.list === true);
return { mode: meta.mode, fields: visible_fields };
```

- `user_field` excluded (internal config)
- Permission booleans excluded (use `mode` string)

## Role-Based Access

Format: `"role_name:mode"` or `"role_name:mode:view"`

Mode characters: `c`reate, `r`ead, `s`earch, `u`pdate, `d`elete, `b`atch-delete, `o`clone, `i`mport, `e`xport, `*`all

```typescript
roles: [
  "admin:*", // All permissions
  "editor:crsu", // Create, read, search, update
  "viewer:rs", // Read, search only
];
```

## Reference Fields

```typescript
// One-to-one (string - default)
{ name: "owner", ref: "user", delete: "cascade" }

// One-to-many (array)
{ name: "tags", type: "array", ref: "tag" }

// Link field (auto-populated from ref)
{ name: "owner_name", link: "owner", list: true }
```

Delete modes: `"keep"` | `"cascade"` | undefined

## Multiple Form Views

Organize complex entities with `view` attribute:

```typescript
{
  collection: "product",
  fields: [
    { name: "sku", view: "*" },           // All views
    { name: "name", view: "*" },
    { name: "price", view: "basic" },     // Basic view only
    { name: "cost", view: "pricing" },    // Pricing view only
    { name: "margin", view: "pricing" },
    { name: "stock", view: "inventory" }, // Inventory view only
  ],
}
```

Client requests specific view: `GET /meta?view=pricing`

## Best Practices

### 1. Always Define Primary Keys

```typescript
// ✅ Good - single key
{ collection: "user", primary_keys: ["email"] }

// ✅ Good - composite key
{ collection: "order_item", primary_keys: ["order_id", "product_id"] }

// ❌ Bad - missing primary_keys (throws error)
{ collection: "user", fields: [...] }
```

### 2. Set ref_label for Referenced Entities

```typescript
// ✅ Good - can be referenced by other entities
{ collection: "user", ref_label: "name" }

// ⚠️ Warning - cannot be referenced (throws error if used as ref target)
{ collection: "user" }  // Missing ref_label
```

### 3. Use Link Fields for Display Data

```typescript
// ✅ Good - denormalize common display fields
fields: [
  { name: "owner", ref: "user" },
  { name: "owner_name", link: "owner", list: true }, // Auto-populated
  { name: "owner_email", link: "owner" },
];

// ❌ Avoid - manually joining in queries
// The framework handles link population automatically
```

### 4. Leverage Field Subset Defaults

Only override when needed:

```typescript
// ✅ Good - rely on defaults
{ name: "title" }  // All flags default to true

// ✅ Good - override specific flag
{ name: "internal_notes", list: false }  // Hide from list, show elsewhere

// ❌ Bad - redundant explicit defaults
{ name: "title", create: true, update: true, list: true }  // Unnecessary
```

## Lifecycle Hooks

Hooks can set sys fields since they run after field filtering:

```typescript
{
  before_create: async ({ entity, data }) => {
    data.created_at = new Date();  // Can set sys field
    data.created_by = data._user?.sub;
    return { code: 0 };  // SUCCESS
  },
  after_read: async ({ id, entity, result }) => { ... },
  list_query: async (query, { user }) => { ... },
}
```

Hook context includes `_user` for accessing authenticated user.

## Security Notes

- **XSS Protection**: `string` type auto-escapes HTML (`<` → `&lt;`)
- **NoSQL Injection**: Type system rejects MongoDB operators (keys with `$`)
- **Field Protection**: `sys` and `secure` fields filtered from client metadata
- **User Field**: Auto-populated, cannot be set by client
- See [type.md](../../../hola/hola-server/skills/type.md) for complete security details

## Common Mistakes

### ❌ Don't Add Type Config to Fields

```typescript
// ❌ WRONG - enum_values is not a field attribute
{ name: "status", type: "status", enum_values: [0, 1, 2] }

// ✅ CORRECT - define type separately
// See add-meta-type skill
register_type(int_enum_type("status", [0, 1, 2]));
{ name: "status", type: "status" }
```

### ❌ Don't Set sys Field Flags to true

```typescript
// ❌ WRONG - sys fields cannot be created/updated
{ name: "created_by", sys: true, create: true }  // Throws error!

// ✅ CORRECT - sys implies create/update/clone = false
{ name: "created_by", sys: true }
```

### ❌ Don't Use Extra Attributes on Link Fields

```typescript
// ❌ WRONG - link fields only allow: name, link, list
{ name: "owner_name", link: "owner", create: false }  // Invalid!

// ✅ CORRECT - only allowed attributes
{ name: "owner_name", link: "owner", list: true }
```

## Related Skills

- `add-meta-type` - Create custom types with validation
- `crud-create-router` - Generate complete CRUD routers
- See [meta.md](../../../hola/hola-server/skills/meta.md) for comprehensive documentation
