# Stage 3: Server Implementation

## Objective

Implement server-side routers with hola's built-in functionality:

- **PRIMARY: Use hola's entity methods** (find, create, update, delete)
- Set operation flags appropriately
- **LAST RESORT: Use lifecycle hooks** only when built-in methods are insufficient
- Implement role-based access control

## Core Principle: Built-in Methods First

**The hola framework provides entity methods that handle 99% of use cases.** Only use custom hooks when you need to:

- Modify data before/after operations
- Add complex validation
- Trigger side effects
- Implement custom business logic

### Available Entity Methods

```javascript
const entity = get_entity("product");

// Read operations
await entity.find_one({ sku: "ABC123" }); // Find single document
await entity.find({ category: "electronics" }); // Find multiple
await entity.find_by_oid(id); // Find by ObjectId
await entity.find_sort({ status: 1 }, { price: -1 }); // Find with sort
await entity.count({ status: 1 }); // Count documents

// Write operations
await entity.create({ sku: "ABC123", name: "Product" }); // Create document
await entity.update({ sku: "ABC123" }, { price: 99 }); // Update matching docs
await entity.delete({ _id: oid }); // Delete documents

// Utility
const query = oid_query(id); // Convert string ID to MongoDB ObjectId query
```

## Basic Router Setup

```javascript
// server/router/product.ts
import { init_router } from "hola-server";

export const router = init_router({
  collection: "product",
  primary_keys: ["sku"],
  ref_label: "name",

  fields: [
    { name: "sku", type: "string", required: true, update: false },
    { name: "name", type: "string", required: true },
    { name: "price", type: "number", required: true },
    { name: "stock", type: "number", default: 0 },
    { name: "category", type: "string", ref: "category" },
  ],

  // Operation flags - enable what users can do
  creatable: true,
  readable: true,
  updatable: true,
  deleteable: true,
  cloneable: false,
  importable: false,
  exportable: true,
});
```

**That's it!** This gives you a full REST API with:

- `POST /product` - Create product
- `GET /product` - List products
- `GET /product/:id` - Get product by ID
- `PUT /product/:id` - Update product
- `DELETE /product/:id` - Delete product
- `GET /product/export` - Export products

## When to Use Hooks

### Hooks Decision Tree

```
Do you need to modify data or add logic?
├─ NO → Don't use hooks, built-in methods are sufficient
└─ YES
   ├─ Before operation? → before_create, before_update, before_delete
   ├─ After operation? → after_create, after_update, after_delete
   ├─ Filter list results? → list_query
   └─ Completely custom logic? → create, update, delete (override)
```

### Hook Types & Arguments

| Hook            | args[0] | args[1]   | args[2] | Use Case                           |
| --------------- | ------- | --------- | ------- | ---------------------------------- |
| `before_create` | entity  | data      | -       | Validate/modify data before create |
| `after_create`  | entity  | data      | -       | Side effects after create          |
| `before_update` | \_id    | entity    | data    | Validate/modify before update      |
| `after_update`  | \_id    | entity    | data    | Side effects after update          |
| `before_delete` | entity  | id_array  | -       | Validate before delete             |
| `after_delete`  | entity  | id_array  | -       | Side effects after delete          |
| `before_clone`  | \_id    | entity    | data    | Modify clone data                  |
| `after_clone`   | \_id    | entity    | data    | Side effects after clone           |
| `list_query`    | entity  | param_obj | req     | Filter list query                  |

**CRITICAL**: Use `...args: unknown[]` and type assertion inside hooks.

## Common Hook Patterns

### Pattern 1: Auto-generate Field Values

```javascript
import { init_router } from "hola-server";

export const router = init_router({
  collection: "order",
  primary_keys: ["orderNo"],
  fields: [
    { name: "orderNo", type: "string", required: true, sys: true },
    { name: "customer", type: "string", ref: "customer", required: true },
    { name: "total", type: "number", required: true }
  ],

  creatable: true,
  readable: true,

  // Generate orderNo before creation
  before_create: async (...args: unknown[]) => {
    const data = args[1] as Record<string, unknown>;
    data.orderNo = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
});
```

### Pattern 2: Validation Logic

```javascript
before_update: async (...args: unknown[]) => {
  const _id = args[0] as string;
  const entity = args[1];
  const data = args[2] as Record<string, unknown>;

  // Custom validation
  if (data.stock !== undefined && data.stock < 0) {
    throw new Error("Stock cannot be negative");
  }

  // Business rule validation
  if (data.price !== undefined && data.price < 1) {
    throw new Error("Price must be at least $1");
  }
}
```

### Pattern 3: Filter Results by Role (list_query)

```javascript
import { init_router } from "hola-server";
import { Context } from "elysia";

export default init_router({
  collection: "post",
  primary_keys: ["slug"],
  fields: [...],
  readable: true,

  // Filter posts by user role
  list_query: (...args: unknown[]) => {
    const ctx = args[2] as Context & { user?: { _id: string; role: string } };
    const user = ctx.user;  // User is attached by holaAuth plugin

    // Return NEW query object (don't mutate entity!)
    if (user?.role === "admin") {
      return {};  // Admins see all posts
    }

    if (user?.role === "author") {
      return { author: user._id };  // Authors see only their posts
    }

    return { status: 1 };  // Public sees only published posts
  }
});
```

**CRITICAL**: `list_query` must return a **new plain object**. DO NOT mutate `args[0]` (the entity instance).

### Pattern 4: Side Effects After Create

```javascript
import { get_entity, init_router } from "hola-server";

export const router = init_router({
  collection: "order",
  fields: [...],
  creatable: true,

  after_create: async (...args: unknown[]) => {
    const data = args[1] as Record<string, unknown>;
    const productEntity = get_entity("product");

    // Decrease product stock after order
    const items = data.items as Array<{ productId: string; quantity: number }>;
    for (const item of items) {
      await productEntity.update(
        { _id: item.productId },
        { $inc: { stock: -item.quantity, sold: item.quantity } }
      );
    }
  }
});
```

### Pattern 5: Cascade Delete

```javascript
import { get_entity, oid_query, init_router } from "hola-server";

export const router = init_router({
  collection: "post",
  fields: [...],
  deleteable: true,

  after_delete: async (...args: unknown[]) => {
    const id_array = args[1] as string[];
    const commentEntity = get_entity("comment");

    // Delete all comments for deleted posts
    for (const id of id_array) {
      const query = oid_query(id);
      if (query) {
        await commentEntity.delete({ post: query._id });
      }
    }
  }
});
```

## Role-Based Access Control

### Method 1: Entity-Level Roles

```javascript
export default init_router({
  collection: "product",
  fields: [...],

  // Define role access
  roles: [
    {
      role: "admin",
      creatable: true,
      readable: true,
      updatable: true,
      deleteable: true
    },
    {
      role: "customer",
      readable: true  // Customers can only read
    }
  ]
});
```

### Method 2: User Field Ownership

```javascript
export default init_router({
  collection: "post",
  user_field: "author", // Field containing user ID
  fields: [{ name: "author", type: "string", ref: "user", sys: true }],

  creatable: true,
  updatable: true, // Users can update their own posts
  deleteable: true, // Users can delete their own posts
});
```

### Method 3: Custom Hook Authorization

```javascript
import {
  SUCCESS,           // 1
  NO_SESSION,        // 200 - Not logged in
  NO_RIGHTS,         // 201 - Forbidden
  NO_PARAMS,         // 202 - Missing parameters
  NOT_FOUND,         // 203 - Resource not found
  INVALID_PARAMS,    // 204 - Invalid parameters
  DUPLICATE_KEY      // 300 - Duplicate key error
} from "hola-server";

export default init_router({
  collection: "order",
  fields: [...],

  before_update: async (...args: unknown[]) => {
    const _id = args[0] as string;
    const entity = args[1];
    const data = args[2] as Record<string, unknown>;
    const ctx = args[3] as { user?: { _id: string; role: string } };

    const user = ctx.user;  // User attached by holaAuth plugin

    // Only admins can change order status to "shipped"
    if (data.status === 2 && user?.role !== "admin") {
      throw { code: NO_RIGHTS, msg: "Only admins can ship orders" };
    }
  }
});
```

## Using Entity Methods in Hooks

```javascript
import { get_entity, oid_query } from "hola-server";

module.exports = init_router({
  collection: "review",
  fields: [...],

  after_create: async (...args: unknown[]) => {
    const data = args[1] as Record<string, unknown>;
    const productEntity = get_entity("product");
    const reviewEntity = get_entity("review");

    // Recalculate product average rating
    const productId = data.product as string;
    const reviews = await reviewEntity.find({ product: productId });

    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    const query = oid_query(productId);
    if (query) {
      await productEntity.update(query, { avgRating });
    }
  }
});
```

## JWT Authentication

The `holaAuth` plugin uses JWT tokens for authentication. Custom login/logout routes must generate and manage these tokens.

### Server Settings for Auth

```javascript
// setting.ts
export const settings: Settings = {
  server: {
    // URLs excluded from authentication
    exclude_urls: [
      '/customer/login',
      '/customer/register',
      '/product/list',
      '/category/list',
    ],
    session: {
      secret: 'your_jwt_secret_key',
      cookie_max_age: 24 * 60 * 60 * 1000, // 24 hours
    },
  },
};
```

### Main.ts Configuration

```javascript
// main.ts
import { plugins } from "hola-server";

const app = new Elysia().use(
  plugins.holaAuth({
    secret: settings.server.session.secret,
    excludeUrls: settings.server.exclude_urls, // Pass exclude URLs here!
  }),
);
```

### Login Route with JWT

```javascript
import { init_router, get_type, Entity, is_root_role, code } from 'hola-server';

const router = init_router({
  collection: 'customer',
  // ... other config

  route: (router, meta) => {
    const entity = new Entity(meta);

    // Login - generates JWT token and sets cookie
    router.post('/login', async (ctx: {
      body: Record<string, unknown>;
      accessJwt: { sign: (payload: Record<string, unknown>) => Promise<string> };
      cookie: Record<string, { set: (opts: Record<string, unknown>) => void }>
    }) => {
      const { email, password } = ctx.body as { email?: string; password?: string };
      if (!email || !password) {
        return { code: code.NO_PARAMS, err: 'Email and password required' };
      }

      const encrypted = get_type('password').convert(password)['value'];
      const customer = await entity.find_one(
        { email, password: encrypted },
        { _id: 1, name: 1, email: 1, role: 1, status: 1 }
      );

      if (customer && customer.status === CUSTOMER_STATUS.ACTIVE) {
        const role_name = get_role_name(customer.role);

        // Generate JWT token
        const token = await ctx.accessJwt.sign({
          sub: customer._id + '',
          role: role_name,
          name: customer.name
        });

        // Set HTTP-only cookie
        ctx.cookie.access_token.set({
          value: token,
          httpOnly: true,
          secure: false,  // Set true in production with HTTPS
          sameSite: 'lax',
          path: '/'
        });

        return {
          code: code.SUCCESS,
          role: role_name,
          root: is_root_role(role_name),
          user: { id: customer._id, name: customer.name, email: customer.email },
        };
      }

      return { code: code.NOT_FOUND, err: "Invalid credentials" };
    });
  }
});
```

### Get Current User Role

```javascript
// The holaAuth plugin derives user from JWT and makes it available as ctx.user
router.get('/role', (ctx: { user?: { sub: string; role?: string; name?: string } }) => {
  const role = ctx.user?.role ?? null;
  const user = ctx.user
    ? { id: ctx.user.sub, name: ctx.user.name }
    : null;
  return { code: code.SUCCESS, role, user };
});
```

### Logout Route

```javascript
// Remove the access_token cookie
router.get('/logout', (ctx: { cookie: Record<string, { remove: () => void }> }) => {
  if (ctx.cookie?.access_token) ctx.cookie.access_token.remove();
  return { code: code.SUCCESS };
});
```

### JWT Payload Structure

The `holaAuth` plugin expects JWT with this structure:

```typescript
interface JwtPayload {
  sub: string; // User ID (required)
  role?: string; // User role name
  name?: string; // User display name
  groups?: string[]; // User groups (optional)
  iat?: number; // Issued at (auto-set)
  exp?: number; // Expiry (auto-set)
}
```

### Client-Side Handling

On the client, handle 401 responses to redirect to login:

```javascript
// main.ts (client)
const axiosInstance = initAxios({ baseURL: "http://localhost:3003" });

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Reset auth state and redirect to login
      userRole = null;
      authChecked = false;
      router.push({ name: "login" });
    }
    return Promise.reject(error);
  },
);
```

## HTTP Status Codes

Use hola's predefined status codes:

```javascript
import {
  SUCCESS,           // 1
  NO_SESSION,        // 200 - Not logged in
  NO_RIGHTS,         // 201 - Forbidden
  NO_PARAMS,         // 202 - Missing parameters
  NOT_FOUND,         // 203 - Resource not found
  INVALID_PARAMS,    // 204 - Invalid parameters
  DUPLICATE_KEY      // 300 - Duplicate key error
} from "hola-server/http/code";

// Usage in hooks
before_create: async (...args: unknown[]) => {
  const data = args[1] as Record<string, unknown>;

  if (!data.email) {
    throw { code: NO_PARAMS, msg: "Email is required" };
  }

  const existing = await entity.find_one({ email: data.email });
  if (existing) {
    throw { code: DUPLICATE_KEY, msg: "Email already exists" };
  }
}
```

## Complete Example: Order Management

```javascript
import { init_router, get_entity, oid_query } from "hola-server";
import { NO_RIGHTS, INVALID_PARAMS } from "hola-server/http/code";

const ORDER_STATUS = {
  PENDING: 0,
  CONFIRMED: 1,
  SHIPPED: 2,
  DELIVERED: 3,
  CANCELLED: 4
};

export const router = init_router({
  collection: "order",
  primary_keys: ["orderNo"],
  ref_label: "orderNo",
  user_field: "customer",

  fields: [
    { name: "orderNo", type: "string", required: true, sys: true, update: false },
    { name: "customer", type: "string", ref: "customer", required: true, sys: true },
    { name: "items", type: "array", required: true },
    { name: "total", type: "number", required: true, sys: true },
    { name: "status", type: "order_status", default: ORDER_STATUS.PENDING },
    { name: "shippedAt", type: "date" },
    { name: "deliveredAt", type: "date" }
  ],

  creatable: true,
  readable: true,
  updatable: true,

  // Generate order number before creation
  before_create: async (...args: unknown[]) => {
    const data = args[1] as Record<string, unknown>;
    data.orderNo = `ORD-${Date.now()}`;

    // Calculate total from items
    const items = data.items as Array<{ price: number; quantity: number }>;
    data.total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  // Update product stock after order creation
  after_create: async (...args: unknown[]) => {
    const data = args[1] as Record<string, unknown>;
    const productEntity = get_entity("product");

    const items = data.items as Array<{ productId: string; quantity: number }>;
    for (const item of items) {
      const query = oid_query(item.productId);
      if (query) {
        await productEntity.update(query, {
          $inc: { stock: -item.quantity, sold: item.quantity }
        });
      }
    }
  },

  // Validate status updates and set timestamps
  before_update: async (...args: unknown[]) => {
    const _id = args[0] as string;
    const entity = args[1];
    const data = args[2] as Record<string, unknown>;

    if (data.status !== undefined) {
      const newStatus = data.status as number;

      // Set timestamps based on status
      if (newStatus === ORDER_STATUS.SHIPPED) {
        data.shippedAt = new Date();
      } else if (newStatus === ORDER_STATUS.DELIVERED) {
        data.deliveredAt = new Date();
      }

      // Validate status transitions
      const query = oid_query(_id);
      if (query) {
        const order = await entity.find_one(query);
        const currentStatus = order.status as number;

        // Can't ship a cancelled order
        if (currentStatus === ORDER_STATUS.CANCELLED && newStatus === ORDER_STATUS.SHIPPED) {
          throw { code: INVALID_PARAMS, msg: "Cannot ship a cancelled order" };
        }
      }
    }
  },

  // Filter orders by role
  list_query: async (...args: unknown[]) => {
    const ctx = args[2] as any;
    const user = await ctx.getUser();

    if (user?.role === "admin") {
      return {};  // Admins see all orders
    }

    return { customer: user?._id };  // Customers see only their orders
  }
});
```

## Checklist

Before proceeding to Stage 4:

- [ ] All routers created with `init_router()`
- [ ] Operation flags set appropriately
- [ ] Built-in entity methods used where possible
- [ ] Hooks added only when necessary
- [ ] Role-based access control implemented
- [ ] HTTP status codes used correctly
- [ ] All relationships properly configured

## Next Step

Proceed to **[04-client.md](04-client.md)** to build the web client UI.
