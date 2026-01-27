---
name: add-meta-type
description: Add customized types to the Hola meta-programming framework. Use when the user says "add a meta programming type", "create custom type", "add type validation", or needs to define entity field types for server/client validation. See references/type_guide.md for comprehensive documentation.
---

# Add Meta Programming Type

Add customized type definitions to the Hola meta-programming framework for entity field validation.

## Trigger Phrases

- "add a meta programming type"
- "create custom type"
- "add type validation"
- "define new type"
- "register type"

## Overview

The Hola framework uses a type system for:
1. **Server-side validation** - Data conversion and validation in the backend
2. **Client-side validation** - Form input validation and display in the frontend
3. **Schema validation** - TypeBox schema for request body validation

## Quick Reference

### Type Categories

| Category | Use Case | Example |
|----------|----------|---------|
| **Int Enum** | Fixed set of options (stored as integers) | Status, Category, Priority |
| **Int Range** | Numeric range validation | Age (18-65), Rating (1-5) |
| **Regex Pattern** | Format validation | SKU code, Phone number |
| **Custom Logic** | Complex business rules | Discount rate, Custom calculations |

### Helper Functions

| Function | Purpose | Example |
|----------|---------|---------|
| `int_enum_type(name, values)` | Create int enum | `int_enum_type("status", [0,1,2])` |
| `int_range_type(name, min, max)` | Create range | `int_range_type("age", 18, 65)` |
| `regex_type(name, pattern)` | Pattern validation | `regex_type("sku", /^[A-Z]{3}/)` |
| `ok(value)` | Return success | `ok(42)` |
| `err(type, value)` | Return error | `err("int", "abc")` |

## Implementation Steps

### Step 1: Server-Side Type Registration

**Location:** `hola-server/router/[entity].js` or `hola-server/core/type.js`

```javascript
import { register_type, int_enum_type, register_schema_type } from "hola-server";
import { t } from "elysia";

// Example 1: Int Enum Type
register_type(int_enum_type("order_status", [0, 1, 2, 3]));
// 0=Pending, 1=Processing, 2=Shipped, 3=Delivered

// Register TypeBox schema for request validation
register_schema_type("order_status", () => 
  t.Union([t.Literal(0), t.Literal(1), t.Literal(2), t.Literal(3)])
);

// Example 2: Int Range Type
register_type(int_range_type("priority", 1, 5));
register_schema_type("priority", () => 
  t.Number({ minimum: 1, maximum: 5 })
);

// Example 3: Custom Type
register_type({
  name: "discount_rate",
  convert: (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return err("discount_rate", value);
    if (num < 0 || num > 100) return err("discount_rate", value);
    return ok(parseFloat(num.toFixed(2)));
  }
});
register_schema_type("discount_rate", () => 
  t.Number({ minimum: 0, maximum: 100 })
);
```

### Step 2: Client-Side Type Registration

**Location:** `hola-web/src/types/[entity].js` or `hola-web/src/core/type.js`

```javascript
import { register_type } from "@/core/type";

// Example 1: Int Enum with i18n
register_type({
  name: "order_status",
  input_type: "autocomplete",
  items: (vue) => [
    { value: 0, text: vue.$t("order_status.pending") },
    { value: 1, text: vue.$t("order_status.processing") },
    { value: 2, text: vue.$t("order_status.shipped") },
    { value: 3, text: vue.$t("order_status.delivered") }
  ],
  format: (value, vue) => {
    const statuses = ["pending", "processing", "shipped", "delivered"];
    return statuses[value] ? vue.$t(`order_status.${statuses[value]}`) : "";
  }
});

// Example 2: Range Input
register_type({
  name: "priority",
  input_type: "slider",
  min: 1,
  max: 5,
  step: 1,
  rule: (vue, field_name) => {
    const err = vue.$t("type.priority", { field: field_name });
    return (value) => {
      const num = parseInt(value);
      return (num >= 1 && num <= 5) || err;
    };
  },
  format: (value) => `Priority ${value}`
});

// Example 3: Custom Validation
register_type({
  name: "discount_rate",
  input_type: "number",
  suffix: "%",
  rule: (vue, field_name) => {
    const err = vue.$t("type.discount_rate", { field: field_name });
    return (value) => {
      if (!value) return true;
      const num = parseFloat(value);
      return (!isNaN(num) && num >= 0 && num <= 100) || err;
    };
  },
  format: (value) => value ? `${value.toFixed(2)}%` : ""
});
```

### Step 3: Add i18n Translations

**Location:** `hola-web/src/locales/en.json` (and other locale files)

```json
{
  "order_status": {
    "pending": "Pending",
    "processing": "Processing",
    "shipped": "Shipped",
    "delivered": "Delivered"
  },
  "type": {
    "priority": "Priority must be between 1 and 5",
    "discount_rate": "Discount rate must be between 0 and 100"
  }
}
```

### Step 4: Use in Entity Definition

```javascript
import { init_router } from "hola-server";

module.exports = init_router({
  collection: "order",
  creatable: true,
  readable: true,
  updatable: true,
  deleteable: true,

  fields: [
    { name: "status", type: "order_status", required: true, default: 0 },
    { name: "priority", type: "priority" },
    { name: "discount", type: "discount_rate" }
  ]
});
```

## Critical: Initialization Order

⚠️ **MUST register types BEFORE importing routers!**

**Correct Order in `main.ts`:**

```typescript
import { init_settings } from "hola-server";
import { register_types } from "./core/type.js";

// 1. Initialize settings and register types FIRST
init_settings(settings);
register_types();

// 2. Dynamic import routers AFTER types are registered
const userRouter = (await import("./router/user.js")).default;
const orderRouter = (await import("./router/order.js")).default;

// 3. Build app
const app = new Elysia()
  .use(userRouter)
  .use(orderRouter);
```

## Best Practices

1. **Use Int Enums** - Store integers in DB, show i18n labels in UI
2. **Keep Types DRY** - Use built-in helpers (`int_enum_type`, `int_range_type`)
3. **Match Validation** - Server and client rules should match
4. **Descriptive Names** - Use `order_status`, not just `status`
5. **Register Schema Types** - Always register both `register_type()` and `register_schema_type()`

## Common Patterns

### Pattern 1: Boolean Flag (Yes/No)
```javascript
// Server
register_type(int_enum_type("yes_no", [0, 1])); // 0=No, 1=Yes
register_schema_type("yes_no", () => t.Union([t.Literal(0), t.Literal(1)]));

// Client
register_type({
  name: "yes_no",
  input_type: "autocomplete",
  items: (vue) => [
    { value: 0, text: vue.$t("common.no") },
    { value: 1, text: vue.$t("common.yes") }
  ]
});
```

### Pattern 2: Rating Scale
```javascript
// Server
register_type(int_range_type("rating", 1, 5));
register_schema_type("rating", () => t.Number({ minimum: 1, maximum: 5 }));

// Client
register_type({
  name: "rating",
  input_type: "slider",
  min: 1,
  max: 5,
  format: (value) => `⭐ ${value}`
});
```

## For More Details

See [references/type_guide.md](references/type_guide.md) for comprehensive documentation including:
- All built-in types
- Field attribute restrictions
- Advanced customization
- Complete examples
- Troubleshooting
