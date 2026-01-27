# Anti-Patterns - Common Mistakes to Avoid

Learn from common mistakes when using the Hola meta-programming framework.

## ❌ Anti-Pattern 1: Mutating Entity in list_query

### The Mistake

```javascript
list_query: (...args: unknown[]) => {
  const query = args[0] as Record<string, unknown>;  // WRONG! args[0] is Entity
  query.status = 1;  // Mutating entity instance causes circular BSON error
  return query;
}
```

### The Problem

`args[0]` is the `Entity` instance, not a query object. Mutating it causes circular reference errors when MongoDB tries to serialize it.

### ✅ Correct Approach

```javascript
list_query: (...args: unknown[]) => {
  const req = args[2] as Request;
  const user = (req.session as any)?.user;

  // Return a NEW plain object
  if (user?.role === "admin") {
    return {};
  }

  return { status: 1 };  // New object, not mutation
}
```

**Rule**: Always return a **new plain object** from `list_query`.

---

## ❌ Anti-Pattern 2: Using Non-Existent Entity Methods

### The Mistake

```javascript
// These methods don't exist!
await entity.find_by_id(id); // ❌
await entity.update_by_id(id, data); // ❌
await entity.findOne(query); // ❌ (wrong case)
```

### ✅ Correct Approach

```javascript
import { get_entity, oid_query } from "hola-server";

const entity = get_entity("product");

// Correct methods
await entity.find_by_oid(id); // ✅
await entity.find_one(query); // ✅
await entity.find(query); // ✅
await entity.update(oid_query(id), data); // ✅
```

**Rule**: Use the [documented entity methods](meta-api.md#entity-methods).

---

## ❌ Anti-Pattern 3: Incorrect Hook Argument Order

### The Mistake

```javascript
before_update: async (...args: unknown[]) => {
  const data = args[0] as Record<string, unknown>;  // WRONG order!
  const _id = args[1] as string;
}

after_update: async (...args: unknown[]) => {
  const entity = args[0];
  const data = args[1] as Record<string, unknown>;  // Missing _id!
}
```

### The Problem

Different hooks have different argument orders. Mixing them up causes runtime errors.

### ✅ Correct Approach

```javascript
// before_create: (entity, data)
before_create: async (...args: unknown[]) => {
  const entity = args[0];  // Entity instance
  const data = args[1] as Record<string, unknown>;
},

// before_update: (_id, entity, data)
before_update: async (...args: unknown[]) => {
  const _id = args[0] as string;
  const entity = args[1];
  const data = args[2] as Record<string, unknown>;
},

// after_update: (_id, entity, data)
after_update: async (...args: unknown[]) => {
  const _id = args[0] as string;
  const entity = args[1];
  const data = args[2] as Record<string, unknown>;
},

// before_delete: (entity, id_array)
before_delete: async (...args: unknown[]) => {
  const entity = args[0];
  const id_array = args[1] as string[];
},

// list_query: (entity, param_obj, req)
list_query: (...args: unknown[]) => {
  const entity = args[0];
  const param_obj = args[1];
  const req = args[2] as Request;
  return {};  // Return new query object
}
```

**Rule**: Refer to the [hook arguments table](meta-api.md#lifecycle-hooks) and use correct order.

---

## ❌ Anti-Pattern 4: Using Wrong HTTP Status Codes

### The Mistake

```javascript
import { init_router } from "hola-server";

module.exports = init_router({
  before_create: async (...args: unknown[]) => {
    throw { code: 403, msg: "Forbidden" }; // ❌ Wrong code
    throw { code: 409, msg: "Already exists" }; // ❌ Wrong code
  },
});
```

### ✅ Correct Approach

```javascript
import { init_router } from "hola-server";
const {
  NO_RIGHTS, // 201 - Use instead of 403
  DUPLICATE_KEY, // 300 - Use instead of 409
  NO_PARAMS, // 202
  INVALID_PARAMS, // 204
  NOT_FOUND, // 203
} from "hola-server";

module.exports = init_router({
  before_create: async (...args: unknown[]) => {
    throw { code: NO_RIGHTS, msg: "Forbidden" }; // ✅
    throw { code: DUPLICATE_KEY, msg: "Already exists" }; // ✅
  },
});
```

**Rule**: Use hola's [predefined status codes](meta-api.md#http-status-codes).

---

## ❌ Anti-Pattern 5: Overusing Hooks Instead of Built-in Methods

### The Mistake

```javascript
// Overriding create to do what built-in already does
create: async (...args: unknown[]) => {
  const entity = args[0];
  const data = args[1] as Record<string, unknown>;

  // Manually validating, inserting, etc.
  if (!data.name) throw new Error("Name required");

  const result = await entity.db.collection('product').insertOne(data);
  return result;
}
```

### ✅ Correct Approach

```javascript
// Use built-in create (no override needed) + simple hook
before_create: async (...args: unknown[]) => {
  const data = args[1] as Record<string, unknown>;

  // Only add custom logic
  data.slug = data.name.toLowerCase().replace(/ /g, '-');
}

// No need to override create!
```

**Rule**: Use hooks only for custom logic. Let hola handle CRUD operations.

---

## ❌ Anti-Pattern 6: Incorrectly Defining Link Fields

### The Mistake

```javascript
fields: [
  { name: "category", type: "string", ref: "category" },
  {
    name: "categoryName",
    link: "category",
    type: "string", // ❌ Extra attributes not allowed
    required: true, // ❌
    create: true, // ❌
  },
];
```

### ✅ Correct Approach

```javascript
fields: [
  { name: "category", type: "string", ref: "category" },
  {
    name: "categoryName",
    link: "category", // ✅ Only name, link, list allowed
    list: true,
  },
];
```

**Rule**: Link fields only support `name`, `link`, and `list` attributes.

---

## ❌ Anti-Pattern 7: Not Using Multi-View for Complex Forms

### The Mistake

```javascript
// One giant form with all fields
fields: [
  { name: "email", type: "email", required: true },
  { name: "name", type: "string", required: true },
  { name: "phone", type: "phone" },
  { name: "address", type: "string" },
  { name: "bio", type: "text" },
  { name: "role", type: "user_role" },
  { name: "status", type: "user_status" },
  // All shown in every form! Overwhelming.
];
```

### ✅ Correct Approach

```javascript
fields: [
  // Quick signup
  { name: "email", type: "email", required: true, view: "*" },
  { name: "password", type: "password", required: true, view: "quick" },

  // Full registration
  { name: "name", type: "string", required: true, view: "*" },
  { name: "phone", type: "phone", view: "default" },
  { name: "address", type: "string", view: "default" },

  // Admin only
  { name: "role", type: "user_role", view: "admin" },
  { name: "status", type: "user_status", view: "admin" },
];
```

**Client usage**:

```vue
<!-- Quick signup -->
<h-crud entity="user" mode="c" createView="quick" />

<!-- Full registration -->
<h-crud entity="user" mode="c" createView="default" />

<!-- Admin management -->
<h-crud entity="user" mode="crud" createView="admin" updateView="admin" />
```

**Rule**: Use `view` attribute to organize complex forms.

---

## ❌ Anti-Pattern 8: Not Configuring Field Visibility

### The Mistake

```javascript
// Everything defaults to true - description shows in list!
fields: [
  { name: "sku", type: "string", required: true },
  { name: "name", type: "string", required: true },
  { name: "description", type: "text", required: true }, // Huge text in table!
  { name: "internalNotes", type: "text" }, // Should be sys: true!
];
```

### ✅ Correct Approach

```javascript
fields: [
  { name: "sku", type: "string", required: true, update: false },
  { name: "name", type: "string", required: true },

  // Long text - don't show in list
  { name: "description", type: "text", required: true, create: true, update: true, list: false },

  // Internal only - system field
  { name: "internalNotes", type: "text", sys: true, create: false, update: true, list: false },

  // System calculated - not editable
  { name: "viewCount", type: "number", sys: true, list: true, create: false, update: false },
];
```

**Rule**: Think deeply about `create`, `list`, `search`, `update`, `sys` for each field.

---

## ❌ Anti-Pattern 9: Creating Custom Types Unnecessarily

### The Mistake

```javascript
// Creating types for things already built-in
import { register_type, ok, err } from "hola-server";

register_type({
  name: "email_address", // ❌ Use built-in "email"
  convert: (value) => (/\S+@\S+\.\S+/.test(String(value)) ? ok(value) : err("email_address", value)),
});

register_type({
  name: "whole_number", // ❌ Use built-in "int"
  convert: (value) => (Number.isInteger(Number(value)) ? ok(value) : err("whole_number", value)),
});
```

### ✅ Correct Approach

```javascript
// Use built-in types
fields: [
  { name: "email", type: "email" }, // ✅ Built-in
  { name: "age", type: "int" }, // ✅ Built-in (or use "age" for 0-200 range)
  { name: "price", type: "number" }, // ✅ Built-in
  { name: "website", type: "url" }, // ✅ Built-in
];

// Only create custom types for enums or domain-specific validation
import { register_type, int_enum_type, register_schema_type } from "hola-server";
import { t } from "elysia";

// ✅ Custom enum - use helper
register_type(int_enum_type("product_status", [0, 1, 2, 3]));
// 0=Draft, 1=Published, 2=Archived, 3=Deleted

// ✅ Register schema for request validation
register_schema_type("product_status", () => t.Union([t.Literal(0), t.Literal(1), t.Literal(2), t.Literal(3)]));
```

**Rule**: Check [built-in types](meta-api.md#built-in-types) first. Only create custom types for domain-specific needs.

---

## ❌ Anti-Pattern 10: Not Using h-crud Component

### The Mistake

```vue
<!-- Manually building everything -->
<template>
  <v-container>
    <v-btn @click="showCreateDialog = true">Create</v-btn>

    <v-data-table :items="products" :headers="headers">
      <template v-slot:item.actions="{ item }">
        <v-btn @click="editItem(item)">Edit</v-btn>
        <v-btn @click="deleteItem(item)">Delete</v-btn>
      </template>
    </v-data-table>

    <v-dialog v-model="showCreateDialog">
      <v-form>
        <v-text-field v-model="formData.name" label="Name" />
        <v-text-field v-model="formData.price" label="Price" />
        <!-- Lots of manual form code... -->
      </v-form>
    </v-dialog>
  </v-container>
</template>

<script setup>
// 100+ lines of boilerplate...
</script>
```

### ✅ Correct Approach

```vue
<template>
  <h-crud entity="product" mode="crudsp" :sortKey="['name']" :sortDesc="[false]" itemLabelKey="name" />
</template>

<!-- That's it! Metadata handles everything. -->
```

**Rule**: Use `h-crud` for 90% of entity management. Only build custom when truly necessary.

---

## ❌ Anti-Pattern 11: Mixing One-to-One and One-to-Many References

### The Mistake

```javascript
fields: [
  // Trying to store array in string ref
  { name: "categories", type: "string", ref: "category" }, // ❌ Can't store multiple

  // Or vice versa
  { name: "owner", type: "array", ref: "user" }, // ❌ Should be string for single owner
];
```

### ✅ Correct Approach

```javascript
fields: [
  // One-to-one: string type
  { name: "owner", type: "string", ref: "user" },
  { name: "category", type: "string", ref: "category" },

  // One-to-many: array type
  { name: "tags", type: "array", ref: "tag" },
  { name: "assignees", type: "array", ref: "user" },
];
```

**Rule**: Use `type: "string"` for one-to-one, `type: "array"` for one-to-many references.

---

## ❌ Anti-Pattern 12: Forgetting to Use oid_query

### The Mistake

```javascript
after_create: async (...args: unknown[]) => {
  const data = args[1] as Record<string, unknown>;
  const productEntity = get_entity("product");

  // ❌ Passing string ID directly
  await productEntity.update(
    { _id: data.productId },  // ❌ String, not ObjectId
    { stock: 100 }
  );
}
```

### ✅ Correct Approach

```javascript
import { get_entity, oid_query } from "hola-server";

after_create: async (...args: unknown[]) => {
  const data = args[1] as Record<string, unknown>;
  const productEntity = get_entity("product");

  // ✅ Convert string to ObjectId query
  const query = oid_query(data.productId as string);
  if (query) {
    await productEntity.update(query, { stock: 100 });
  }
}
```

**Rule**: Always use `oid_query()` when working with ObjectId strings.

---

## ❌ Anti-Pattern 13: Not Handling Async Errors in Hooks

### The Mistake

```javascript
before_create: async (...args: unknown[]) => {
  const data = args[1] as Record<string, unknown>;

  // ❌ No error handling - if this fails, user gets generic error
  await someExternalAPI.validate(data);

  data.validated = true;
}
```

### ✅ Correct Approach

```javascript
import { INVALID_PARAMS } from "hola-server";

before_create: async (...args: unknown[]) => {
  const data = args[1] as Record<string, unknown>;

  try {
    await someExternalAPI.validate(data);
    data.validated = true;
  } catch (error) {
    // ✅ Throw meaningful error
    throw {
      code: INVALID_PARAMS,
      msg: `Validation failed: ${error.message}`
    };
  }
}
```

**Rule**: Always handle errors in async hooks and throw meaningful messages.

---

## ❌ Anti-Pattern 14: Not Using Default Values

### The Mistake

```javascript
fields: [
  { name: "status", type: "product_status" },  // ❌ No default - undefined!
  { name: "stock", type: "number" },           // ❌ No default - undefined!
  { name: "featured", type: "boolean" }        // ❌ No default - undefined!
]

before_create: async (...args: unknown[]) => {
  const data = args[1] as Record<string, unknown>;
  // Manually setting defaults in hook ❌
  data.status = data.status || 0;
  data.stock = data.stock || 0;
  data.featured = data.featured || false;
}
```

### ✅ Correct Approach

```javascript
fields: [
  { name: "status", type: "product_status", default: 0 }, // ✅
  { name: "stock", type: "number", default: 0 }, // ✅
  { name: "featured", type: "boolean", default: false }, // ✅
];

// No need for before_create hook!
```

**Rule**: Use `default` attribute instead of setting defaults in hooks.

---

## ❌ Anti-Pattern 15: Exposing Sensitive Data

### The Mistake

```javascript
fields: [
  { name: "password", type: "password" }, // ❌ Still sent to client!
  { name: "apiToken", type: "string" }, // ❌ Visible to everyone!
  { name: "internalNotes", type: "text" }, // ❌ Not marked as sys!
];
```

### ✅ Correct Approach

```javascript
fields: [
  { name: "password", type: "password", secure: true }, // ✅ Never sent to client
  { name: "apiToken", type: "string", secure: true }, // ✅ Completely hidden
  { name: "passwordHash", type: "string", secure: true }, // ✅ Server-only
  { name: "internalNotes", type: "text", sys: true }, // ✅ Server-side only
];
```

**Rule**: Use `secure: true` for passwords/tokens, `sys: true` for server-managed fields.

---

## Summary Checklist

Before deploying, verify:

- [ ] `list_query` returns new object (not mutating entity)
- [ ] Using correct entity methods (`find_by_oid`, not `find_by_id`)
- [ ] Hook arguments in correct order
- [ ] Using hola's HTTP status codes
- [ ] Using hooks only when necessary (not overriding built-in CRUD)
- [ ] Link fields only have `name`, `link`, `list`
- [ ] Complex forms use multi-view strategy
- [ ] Field visibility properly configured
- [ ] Using built-in types before creating custom
- [ ] Using `h-crud` component by default
- [ ] Correct reference types (string vs array)
- [ ] Using `oid_query()` for ObjectId conversion
- [ ] Error handling in async hooks
- [ ] Default values set on fields
- [ ] Sensitive data marked as `secure` or `sys`

---

For correct patterns, see [patterns.md](patterns.md) and [workflow documentation](../workflow/).
