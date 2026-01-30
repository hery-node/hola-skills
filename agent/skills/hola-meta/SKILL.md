---
name: hola-meta
description: Define and validate entity metadata in Hola framework. Use when creating entity routers with init_router(), defining field visibility flags (create, update, clone, search, list), setting up sys/user_field protection, configuring role-based access, or understanding field subset filtering.
---

# Hola Meta Framework

Entity metadata definition using `init_router()` for CRUD operations.

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

- Type conversion includes XSS protection (HTML escaping for strings)
- MongoDB operator injection blocked (rejects `$` prefixed keys)
- See `type.md` for security details
