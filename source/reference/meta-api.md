# Meta API Reference

Complete reference for Hola meta-programming metadata attributes and field definitions.

## Quick Reference

### init_router() - Primary API

```javascript
import { init_router } from "hola-server";

export const router = init_router({
  // Entity Configuration (Required)
  collection: "product",
  primary_keys: ["sku"],
  fields: [...],

  // Operation Flags
  creatable: true,
  readable: true,
  updatable: true,
  deleteable: true,
  cloneable: false,
  importable: false,
  exportable: true,

  // Reference Configuration
  ref_label: "name",
  ref_filter: {},
  user_field: "owner",

  // Lifecycle Hooks
  before_create: async (...args) => {},
  after_create: async (...args) => {},
  before_update: async (...args) => {},
  after_update: async (...args) => {},
  before_delete: async (...args) => {},
  after_delete: async (...args) => {},
  before_clone: async (...args) => {},
  after_clone: async (...args) => {},
  list_query: (...args) => {},

  // Custom Handlers (Override)
  create: async (...args) => {},
  update: async (...args) => {},
  delete: async (...args) => {},

  // Role-Based Access
  roles: ["admin:*", "user:rs"]
});
```

## Meta Attributes (Entity-Level)

### Required Attributes

| Attribute      | Type          | Description                     | Example                           |
| -------------- | ------------- | ------------------------------- | --------------------------------- |
| `collection`   | String        | MongoDB collection name         | `"product"`                       |
| `primary_keys` | Array<String> | Field names forming primary key | `["sku"]` or `["email", "phone"]` |
| `fields`       | Array<Object> | Field definitions               | `[{name: "sku", type: "string"}]` |

### Operation Flags

| Attribute    | Type    | Default | Description             |
| ------------ | ------- | ------- | ----------------------- |
| `creatable`  | Boolean | false   | Enable create operation |
| `readable`   | Boolean | false   | Enable read operation   |
| `updatable`  | Boolean | false   | Enable update operation |
| `deleteable` | Boolean | false   | Enable delete operation |
| `cloneable`  | Boolean | false   | Enable clone operation  |
| `importable` | Boolean | false   | Enable import operation |
| `exportable` | Boolean | false   | Enable export operation |

### Reference Configuration

| Attribute    | Type   | Description                                                  | Example          |
| ------------ | ------ | ------------------------------------------------------------ | ---------------- |
| `ref_label`  | String | Field to use as display label when this entity is referenced | `"name"`         |
| `ref_filter` | Object | Default filter for reference queries                         | `{status: 1}`    |
| `user_field` | String | Field containing user ID for ownership                       | `"owner"`        |
| `route`      | String | Custom route path                                            | `"/custom-path"` |

### Lifecycle Hooks

All hooks use `(...args: unknown[])` signature. Type assert inside hooks.

| Hook                 | args[0] | args[1]   | args[2] | When Called                           |
| -------------------- | ------- | --------- | ------- | ------------------------------------- |
| `before_create`      | entity  | data      | -       | Before creating document              |
| `after_create`       | entity  | data      | -       | After document created                |
| `before_update`      | \_id    | entity    | data    | Before updating document              |
| `after_update`       | \_id    | entity    | data    | After document updated                |
| `before_delete`      | entity  | id_array  | -       | Before deleting document(s)           |
| `after_delete`       | entity  | id_array  | -       | After document(s) deleted             |
| `before_clone`       | \_id    | entity    | data    | Before cloning document               |
| `after_clone`        | \_id    | entity    | data    | After document cloned                 |
| `list_query`         | entity  | param_obj | req     | Modify list query (return new object) |
| `after_batch_update` | entity  | result    | -       | After batch update                    |

**Example**:

```javascript
before_create: async (...args: unknown[]) => {
  const entity = args[0];  // Entity instance (rarely used)
  const data = args[1] as Record<string, unknown>;

  // Modify data before creation
  data.slug = data.name.toLowerCase().replace(/ /g, '-');
  data.createdAt = new Date();
}
```

### Custom Operation Handlers

Override default CRUD handlers completely:

| Handler        | args[0] | args[1]  | args[2] | Returns             |
| -------------- | ------- | -------- | ------- | ------------------- |
| `create`       | entity  | data     | req     | Created document    |
| `update`       | \_id    | entity   | data    | Updated document    |
| `delete`       | entity  | id_array | req     | Delete result       |
| `batch_update` | entity  | updates  | req     | Batch update result |
| `clone`        | \_id    | entity   | data    | Cloned document     |

### Role-Based Access

| Format              | Example             | Description                             |
| ------------------- | ------------------- | --------------------------------------- |
| `"role:modes"`      | `"admin:*"`         | Admin has all permissions               |
| `"role:modes"`      | `"editor:crsu"`     | Editor can create, read, search, update |
| `"role:modes:view"` | `"user:rs:default"` | User can read/search in default view    |

**Mode Characters**:

- `c` - Create
- `r` - Read (single item)
- `s` - Search/list
- `u` - Update
- `d` - Delete
- `b` - Batch delete
- `o` - Clone
- `i` - Import
- `e` - Export
- `*` - All modes

## Field Attributes

### Required Attributes

| Attribute | Type   | Description                               | Example   |
| --------- | ------ | ----------------------------------------- | --------- |
| `name`    | String | Field name (must be unique within entity) | `"email"` |

### Type & Validation

| Attribute  | Type    | Default   | Description                   | Example                                     |
| ---------- | ------- | --------- | ----------------------------- | ------------------------------------------- |
| `type`     | String  | "string"  | Data type                     | `"string"`, `"number"`, `"email"`, `"date"` |
| `required` | Boolean | false     | Field is required             | `true`                                      |
| `default`  | Any     | undefined | Default value if not provided | `0`, `""`, `false`                          |

### Visibility Attributes

| Attribute | Type    | Default | Description                     |
| --------- | ------- | ------- | ------------------------------- |
| `create`  | Boolean | true    | Show in create form             |
| `list`    | Boolean | true    | Show in table list              |
| `search`  | Boolean | true    | Show in search form             |
| `update`  | Boolean | true    | Allow in edit form              |
| `clone`   | Boolean | true    | Include when cloning            |
| `sys`     | Boolean | false   | System field (server-side only) |
| `secure`  | Boolean | false   | Hidden from client entirely     |

### Reference Attributes

| Attribute | Type   | Description                                | Example      |
| --------- | ------ | ------------------------------------------ | ------------ |
| `ref`     | String | Reference to another collection            | `"category"` |
| `link`    | String | Link to another field (must be ref field)  | `"category"` |
| `delete`  | String | Deletion behavior: `"keep"` or `"cascade"` | `"cascade"`  |

### View Attributes

| Attribute | Type   | Default   | Description                                                        |
| --------- | ------ | --------- | ------------------------------------------------------------------ |
| `view`    | String | "\*"      | View context: `"*"` (all), `"default"`, `"quick"`, `"admin"`, etc. |
| `group`   | String | undefined | User group sharing control                                         |

## Built-in Types

| Type       | Validation   | Input Type     | Example                 |
| ---------- | ------------ | -------------- | ----------------------- |
| `string`   | Any string   | text           | `"hello"`               |
| `number`   | Numeric      | number         | `42`, `3.14`            |
| `int`      | Integer      | number         | `42`                    |
| `boolean`  | true/false   | checkbox       | `true`                  |
| `date`     | ISO date     | date           | `"2025-01-16"`          |
| `datetime` | ISO datetime | datetime-local | `"2025-01-16T10:30:00"` |
| `email`    | RFC 5322     | email          | `"user@example.com"`    |
| `phone`    | E.164 format | tel            | `"+12025551234"`        |
| `url`      | Valid URL    | url            | `"https://example.com"` |
| `password` | Any (hashed) | password       | (auto-hashed)           |
| `text`     | Long text    | textarea       | `"Long content..."`     |
| `array`    | Array        | chips/select   | `["a", "b", "c"]`       |
| `obj`      | JSON object  | json-editor    | `{x: 1, y: 2}`          |
| `json`     | JSON data    | json-editor    | `{"key": "value"}`      |
| `file`     | File path    | file-upload    | `"/uploads/file.pdf"`   |

### Custom Types

Custom types use the `convert` function pattern that returns `{value}` on success or `{err}` on failure.

```javascript
// server/src/core/type.ts
import { register_type, int_enum_type, ok, err, is_int, register_schema_type } from "hola-server";
import { t } from "elysia";

// Method 1: Use built-in helper (recommended for enums)
register_type(int_enum_type("task_priority", [0, 1, 2, 3]));
// 0=Low, 1=Medium, 2=High, 3=Urgent

// Register TypeBox schema for request validation
register_schema_type("task_priority", () => t.Union([t.Literal(0), t.Literal(1), t.Literal(2), t.Literal(3)]));

// Method 2: Custom convert function (for complex validation)
register_type({
  name: "discount_rate",
  convert: (value) => {
    const num = parseFloat(String(value));
    if (isNaN(num)) return err("discount_rate", value);
    if (num < 0 || num > 100) return err("discount_rate", value);
    return ok(parseFloat(num.toFixed(2)));
  },
});
```

**Available Helper Functions:**

| Helper                           | Purpose                   | Example                              |
| -------------------------------- | ------------------------- | ------------------------------------ |
| `ok(value)`                      | Return success result     | `ok(42)` → `{value: 42}`             |
| `err(type, value)`               | Return error result       | `err("int", "abc")` → `{err: "..."}` |
| `is_int(value)`                  | Check if value is integer | `is_int(42)` → `true`                |
| `int_enum_type(name, values)`    | Create int enum type      | `int_enum_type("status", [0,1,2])`   |
| `int_range_type(name, min, max)` | Create int range type     | `int_range_type("age", 0, 200)`      |
| `regex_type(name, pattern)`      | Create regex type         | `regex_type("code", /^[A-Z]{3}$/)`   |
| `register_schema_type(name, fn)` | Register TypeBox schema   | See example above                    |

> **IMPORTANT**: Register custom types BEFORE importing router files. See [type.md](../../../hola-server/skills/type.md) for initialization order.

````

## Reference Relationships

### One-to-One Reference

```javascript
{
  name: "category",
  type: "string",        // Single value (default)
  ref: "category",       // Reference to category collection
  delete: "keep"         // Keep product when category deleted
}
````

**Stored as**: `{ category: ObjectId("...") }`

### One-to-Many Reference

```javascript
{
  name: "tags",
  type: "array",         // Multiple values
  ref: "tag",            // Reference to tag collection
  delete: "cascade"      // Delete product when any tag deleted
}
```

**Stored as**: `{ tags: [ObjectId("..."), ObjectId("..."), ...] }`

### Link Fields (Denormalization)

```javascript
// Reference field
{ name: "author", type: "string", ref: "user" },

// Link field (auto-populated from author.name)
{ name: "authorName", type: "string", link: "author", sys: true, list: true }
```

**Link fields only support**: `name`, `link`, `list` attributes.

## Complete Examples

### Example 1: Simple Entity

```javascript
import { init_router } from "hola-server";

export default init_router({
  collection: "category",
  primary_keys: ["name"],
  ref_label: "name",

  fields: [
    { name: "name", type: "string", required: true, update: false },
    { name: "description", type: "text", list: false },
    { name: "icon", type: "string" },
    { name: "order", type: "number", default: 0 },
    { name: "createdAt", type: "date", sys: true, list: true },
  ],

  creatable: true,
  readable: true,
  updatable: true,
  deleteable: true,
});
```

### Example 2: Entity with References

```javascript
import { init_router } from "hola-server";

export default init_router({
  collection: "product",
  primary_keys: ["sku"],
  ref_label: "name",
  user_field: "owner",

  fields: [
    { name: "sku", type: "string", required: true, update: false },
    { name: "name", type: "string", required: true },
    { name: "description", type: "text", create: true, update: true, list: false },

    // One-to-one reference
    { name: "category", type: "string", ref: "category", required: true },
    { name: "categoryName", link: "category", list: true },

    // One-to-many reference
    { name: "tags", type: "array", ref: "tag", list: false },

    // Numbers
    { name: "price", type: "number", required: true },
    { name: "stock", type: "number", default: 0 },

    // Owner
    { name: "owner", type: "string", ref: "user", sys: true, required: true },

    // System fields
    { name: "createdAt", type: "date", sys: true, list: true },
    { name: "updatedAt", type: "date", sys: true }
  ],

  creatable: true,
  readable: true,
  updatable: true,
  deleteable: true,
  exportable: true,

  roles: [
    "admin:*",
    "user:crsu"
  ],

  before_create: async (...args: unknown[]) => {
    const data = args[1] as Record<string, unknown>;
    data.createdAt = new Date();
  },

  before_update: async (...args: unknown[]) => {
    const data = args[2] as Record<string, unknown>;
    data.updatedAt = new Date();
  }
});
```

### Example 3: Multi-View Entity

```javascript
import { init_router } from "hola-server";

export default init_router({
  collection: "user",
  primary_keys: ["email"],
  ref_label: "name",

  fields: [
    // All views
    { name: "email", type: "email", required: true, view: "*" },
    { name: "name", type: "string", required: true, view: "*" },

    // Default view (full registration)
    { name: "phone", type: "phone", view: "default" },
    { name: "address", type: "string", view: "default" },
    { name: "avatar", type: "file", view: "default" },

    // Quick view (minimal signup)
    { name: "password", type: "password", required: true, view: "quick", secure: true },

    // Admin view
    { name: "role", type: "user_role", view: "admin", default: "user" },
    { name: "status", type: "user_status", view: "admin", default: 1 },
    { name: "verified", type: "boolean", view: "admin", sys: true },

    // System
    { name: "createdAt", type: "date", sys: true, list: true },
    { name: "lastLogin", type: "datetime", sys: true },
  ],

  creatable: true,
  readable: true,
  updatable: true,
  deleteable: true,
});
```

## Entity Methods

Access entity instance in custom code:

```javascript
import { get_entity, oid_query } from "hola-server";

const productEntity = get_entity("product");

// Read
const product = await productEntity.find_one({ sku: "ABC123" });
const products = await productEntity.find({ category: "electronics" });
const productById = await productEntity.find_by_oid(id);
const sorted = await productEntity.find_sort({ status: 1 }, { price: -1 });
const count = await productEntity.count({ status: 1 });

// Write
const newProduct = await productEntity.create({ sku: "NEW001", name: "New Product" });
await productEntity.update({ sku: "ABC123" }, { price: 99 });
await productEntity.delete(oid_query(id));

// Update by ID
const query = oid_query(id);
if (query) {
  await productEntity.update(query, { stock: 100 });
}
```

## HTTP Status Codes

```javascript
import {
  SUCCESS, // 1 - Success
  ERROR, // 0 - Generic error
  NO_SESSION, // 200 - Not authenticated
  NO_RIGHTS, // 201 - Forbidden
  NO_PARAMS, // 202 - Missing parameters
  NOT_FOUND, // 203 - Resource not found
  INVALID_PARAMS, // 204 - Invalid parameters
  DUPLICATE_KEY, // 300 - Duplicate key
} from "hola-server/http/code";

// Usage in hooks
throw { code: NO_RIGHTS, msg: "Insufficient permissions" };
throw { code: DUPLICATE_KEY, msg: "Email already exists" };
```

## Validation

Validation occurs automatically based on:

- `required` attribute
- `type` attribute (built-in type validators)
- Custom type validators

**Custom validation in hooks**:

```javascript
before_create: async (...args: unknown[]) => {
  const data = args[1] as Record<string, unknown>;

  if (data.price < 0) {
    throw { code: INVALID_PARAMS, msg: "Price must be positive" };
  }

  if (data.stock > 10000) {
    throw { code: INVALID_PARAMS, msg: "Stock cannot exceed 10000" };
  }
}
```

## Best Practices

1. **Always use `init_router()`** - Never instantiate EntityMeta directly
2. **Type hooks properly** - Use `(...args: unknown[])` and type assertions
3. **Return new objects in list_query** - Don't mutate entity instance
4. **Use built-in types first** - Create custom types only when needed
5. **Deep think field visibility** - Configure create/list/search/update appropriately
6. **System fields for calculated data** - Use `sys: true` for server-managed fields
7. **Secure sensitive data** - Use `secure: true` for passwords, tokens
8. **Leverage multi-views** - Use `view` attribute for different contexts
9. **Use entity methods** - Prefer entity.find/create/update over hooks
10. **Validate early** - Use `before_*` hooks for validation

---

For workflow guidance, see [workflow documentation](../workflow/). For common patterns, see [patterns.md](patterns.md).
