---
name: crud-custom-list-endpoint
description: Define custom list endpoints for CRUD tables to bypass default filtering (e.g., user_field isolation) while maintaining pagination, sorting, and filtering. Use when creating marketplace views, public listings, or custom filtered data lists that need server-side scope control beyond client-side filtering.
---

# CRUD Custom List Endpoint

Define custom server-side list endpoints for CRUD tables that bypass default filtering (like `user_field` isolation) while maintaining full pagination, sorting, and filtering capabilities.

## When to Use This Skill

- User needs a **marketplace view** showing public items from all users (bypassing `user_field` isolation)
- User wants **server-controlled filtering** that client cannot override (e.g., only public skills)
- User needs **custom query logic** beyond standard list endpoint (e.g., aggregations, joins)
- User wants **different list behaviors** for same entity (admin view vs. user view vs. public view)
- **Security requirement**: Client-side filtering is untrustworthy for permission-sensitive data

## Quick Answer

**Define a custom POST endpoint in the server router, then point `h-crud` to it using `list-action`:**

**Server:**

```typescript
// hola-server/router/skill.ts
route: (router, meta) => {
  const entity = new Entity(meta);

  router.post("/public", async ({ body }) => {
    const body_data = body as Record<string, unknown>;
    const filter = { is_public: true }; // Server-enforced filter
    const result = await entity.list_entity(body_data, filter, body_data, "*");
    return { ...result };
  });
};
```

**Client:**

```vue
<!-- hola-web/src/views/SkillMarketView.vue -->
<h-crud entity="skill" list-action="/public" mode="rs">
</h-crud>
```

## Why Custom List Endpoints?

### The Problem: User Field Isolation

When an entity has `user_field` defined, the default `/list` endpoint automatically filters by the current user's ID:

```typescript
// Default behavior in hola-server
if (meta.user_field && user?.sub && !is_admin) {
  // For non-admin users, can only see their own data
  filter[meta.user_field] = user.sub;
}
```

**This means:**

- User A can only see skills where `creator === user_A_id`
- Client-side filtering with `{ is_public: true }` is **applied AFTER** user filter
- Result: User A only sees their own public skills, not all public skills

### The Solution: Custom List Endpoint

A custom endpoint defines the **server-controlled scope** independently:

```typescript
router.post('/public', async () => {
  // Show ALL public skills (bypassing user_field filter)
  const filter = { is_public: true };
  const result = await entity.list_entity(...);
  return result;
});
```

**Client can then apply additional filtering:**

```vue
<!-- Client can filter within the server scope -->
<h-crud
  entity="skill"
  list-action="/public"
  :filter="{ framework: 'vue' }"
>  <!-- Only Vue skills from public skills -->
</h-crud>
```

**Security model:**

- **Server scope**: `is_public === true` (enforced, client cannot bypass)
- **Client filter**: `framework === 'vue'` (optional, within server scope)
- **Result**: Client can only filter within the trusted server scope

## Step-by-Step Instructions

### Step 1: Define Custom Endpoint in Router

**Location:** `hola-server/router/[entity].ts`

Add a `route` function to your entity definition:

```typescript
import { init_router, Entity, code } from "hola-server";
import type { Elysia } from "elysia";

const router = init_router({
  collection: "skill",
  user_field: "creator", // Isolates data by user
  fields: [
    { name: "name", type: "string", required: true },
    { name: "description", type: "text" },
    { name: "is_public", type: "boolean", default: false },
  ],

  // Add custom routes
  route: (router: Elysia, meta) => {
    const entity = new Entity(meta);

    // Custom list endpoint for public marketplace
    router.post("/public", async ({ body }) => {
      const body_data = body as Record<string, unknown>;

      // Server-enforced filter: only public items
      const server_filter: Record<string, unknown> = {
        is_public: true,
      };

      // Use entity.list_entity to get full pagination support
      const result = await entity.list_entity(
        body_data, // Query params (page, limit, sort_by, desc, attr_names)
        server_filter, // Server-enforced filter
        body_data, // Client filters (merged with server_filter)
        "*", // View (field visibility)
      );

      return { ...result };
    });
  },
});

export default router;
```

### Step 2: Point Client to Custom Endpoint

**Location:** `hola-web/src/views/SkillMarketView.vue`

Use the `list-action` prop to override the default `/list` endpoint:

```vue
<template>
  <v-container fluid>
    <h-bread />

    <!-- Points to POST /skill/public instead of POST /skill/list -->
    <h-crud entity="skill" list-action="/public" mode="rs" :search-cols="6">
    </h-crud>
  </v-container>
</template>
```

### Step 3: Test the Flow

1. **Start server:** `cd hola-server && bun run dev`
2. **Navigate to view:** Visit marketplace page in browser
3. **Verify:**
   - Pagination works (page numbers, next/prev)
   - Sorting works (click column headers)
   - Search works (search form filters results)
   - Only public items from all users are shown

## Understanding `entity.list_entity`

The `list_entity` method handles all pagination, sorting, and filtering automatically:

```typescript
async list_entity(
  query_params: Record<string, unknown>,  // { page, limit, sort_by, desc, attr_names }
  query: Record<string, unknown>,         // Server-enforced filter
  param_obj: Record<string, unknown>,     // Client search params (merged with query)
  view: string                            // Field visibility ('*' = all)
): Promise<EntityResult>
```

**Parameters:**

- **`query_params`**: Contains pagination (`page`, `limit`), sorting (`sort_by`, `desc`), and field selection (`attr_names`)
- **`query`**: Your server-enforced filter (e.g., `{ is_public: true }`)
- **`param_obj`**: Contains client search filters from the search form
- **`view`**: Controls field filtering (use `'*'` for all fields)

**What it does automatically:**

1. Validates required params (`attr_names`, `sort_by`, `desc`)
2. Parses pagination (page number, limit)
3. Builds sort object from `sort_by` and `desc`
4. Merges server filter (`query`) with client search (`param_obj`)
5. Executes paginated query with sorting
6. Resolves reference fields
7. Returns `{ code, total, data }`

**Example response:**

```json
{
  "code": 0,
  "total": 42,
  "data": [
    { "_id": "...", "name": "Skill 1", "is_public": true },
    { "_id": "...", "name": "Skill 2", "is_public": true }
  ]
}
```

## Common Patterns

### Pattern 1: Public Marketplace (Bypass user_field)

Show all public items from all users:

```typescript
// Server: hola-server/router/skill.ts
route: (router, meta) => {
  const entity = new Entity(meta);

  router.post("/public", async ({ body }) => {
    const body_data = body as Record<string, unknown>;
    const filter = { is_public: true }; // Only public items
    const result = await entity.list_entity(body_data, filter, body_data, "*");
    return { ...result };
  });
};
```

```vue
<!-- Client: hola-web/src/views/SkillMarketView.vue -->
<h-crud
  entity="skill"
  list-action="/public"
  mode="rs"
>  <!-- Read-only, no create/update/delete -->
</h-crud>
```

### Pattern 2: Admin View (All Items)

Show all items to admin users:

```typescript
// Server: hola-server/router/skill.ts
route: (router, meta) => {
  const entity = new Entity(meta);

  router.post("/admin-list", async ({ user, body }) => {
    // Check admin permission
    if (user?.role !== "admin") {
      return { code: code.NO_RIGHTS, err: "Admin only" };
    }

    const body_data = body as Record<string, unknown>;
    const filter = {}; // No filter - show everything
    const result = await entity.list_entity(body_data, filter, body_data, "*");
    return { ...result };
  });
};
```

```vue
<!-- Client: hola-web/src/views/AdminSkillsView.vue -->
<h-crud
  entity="skill"
  list-action="/admin-list"
  mode="cruds"
>  <!-- Full CRUD for admins -->
</h-crud>
```

### Pattern 3: Status-Based Filtering

Show only items with specific status:

```typescript
// Server: hola-server/router/product.ts
route: (router, meta) => {
  const entity = new Entity(meta);

  router.post("/published", async ({ body }) => {
    const body_data = body as Record<string, unknown>;
    const filter = { status: "published" }; // Only published products
    const result = await entity.list_entity(body_data, filter, body_data, "*");
    return { ...result };
  });
};
```

### Pattern 4: Multiple Custom Endpoints

Different endpoints for different views:

```typescript
// Server: hola-server/router/skill.ts
route: (router, meta) => {
  const entity = new Entity(meta);

  // Public marketplace
  router.post("/public", async ({ body }) => {
    const body_data = body as Record<string, unknown>;
    const filter = { is_public: true };
    const result = await entity.list_entity(body_data, filter, body_data, "*");
    return { ...result };
  });

  // User's own skills
  router.post("/my-skills", async ({ user, body }) => {
    const body_data = body as Record<string, unknown>;
    const filter = { creator: user?.sub }; // Only current user's skills
    const result = await entity.list_entity(body_data, filter, body_data, "*");
    return { ...result };
  });

  // Featured skills (curated)
  router.post("/featured", async ({ body }) => {
    const body_data = body as Record<string, unknown>;
    const filter = { is_public: true, is_featured: true };
    const result = await entity.list_entity(body_data, filter, body_data, "*");
    return { ...result };
  });
};
```

### Pattern 5: Role-Based Filtering

Different scopes for different roles:

```typescript
// Server: hola-server/router/order.ts
route: (router, meta) => {
  const entity = new Entity(meta);

  router.post("/assigned", async ({ user, body }) => {
    const body_data = body as Record<string, unknown>;
    let filter: Record<string, unknown> = {};

    if (user?.role === "admin") {
      // Admin sees all orders
      filter = {};
    } else if (user?.role === "sales") {
      // Sales sees orders assigned to them
      filter = { assigned_to: user?.sub };
    } else {
      // Regular users see their own orders
      filter = { customer_id: user?.sub };
    }

    const result = await entity.list_entity(body_data, filter, body_data, "*");
    return { ...result };
  });
};
```

## Important Notes

### 1. Endpoint Must Support POST

The `h-crud` component ALWAYS sends `POST` requests with body containing:

- `page`, `limit` (pagination)
- `sort_by`, `desc` (sorting)
- `attr_names` (field selection)
- Plus any search form fields

**❌ DON'T use GET:**

```typescript
// BAD - h-crud cannot send complex filters via GET
router.get('/public', async () => { ... });
```

**✅ DO use POST:**

```typescript
// GOOD - POST accepts body with filters and pagination
router.post('/public', async ({ body }) => { ... });
```

### 2. Always Use `entity.list_entity`

Don't manually implement pagination. Use `entity.list_entity` to get:

- ✅ Automatic pagination
- ✅ Automatic sorting
- ✅ Automatic field filtering (`attr_names`)
- ✅ Reference field resolution
- ✅ Search query parsing

**❌ DON'T manually query:**

```typescript
// BAD - Missing pagination, sorting, field filtering
const data = await entity.find({ is_public: true });
return { code: SUCCESS, data };
```

**✅ DO use list_entity:**

```typescript
// GOOD - Full pagination/sorting/filtering support
const result = await entity.list_entity(body_data, filter, body_data, "*");
return { ...result };
```

### 3. Server Filter vs Client Filter

```typescript
const result = await entity.list_entity(
  body_data, // Pagination/sorting params
  server_filter, // ← Server-enforced (trusted)
  body_data, // ← Includes client search (untrusted)
  "*",
);
```

**How filters merge:**

```typescript
// Server filter (line 2 argument)
const server_filter = { is_public: true };

// Client search (from h-crud search form, in body_data)
const client_search = { framework: "vue" };

// Final query (merged automatically)
const final_query = {
  is_public: true, // From server_filter (cannot be bypassed)
  framework: "vue", // From client search (optional)
};
```

### 4. list-action is a Suffix, Not Full URL

```vue
<!-- ❌ WRONG - Don't include entity name -->
<h-crud entity="skill" list-action="/skill/public">

<!-- ✅ CORRECT - Just the suffix -->
<h-crud entity="skill" list-action="/public">
```

The framework automatically constructs: `POST /{entity}{list-action}`

- `entity="skill"` + `list-action="/public"` → `POST /skill/public`

## Security Considerations

### Client Filtering is Untrusted

**Problem:** If using default endpoint with client filter:

```vue
<!-- ❌ INSECURE for permission-sensitive data -->
<h-crud entity="skill" :filter="{ is_public: true }">
</h-crud>
```

**Issue:** Malicious client can modify the filter to:

```javascript
// Client-side JavaScript injection
filter = { is_public: false }; // Now sees private skills!
```

### Server Endpoint is Trusted

**Solution:** Define filter on server:

```typescript
// ✅ SECURE - Server enforces the filter
router.post("/public", async ({ body }) => {
  const filter = { is_public: true }; // Client cannot bypass this
  const result = await entity.list_entity(body_data, filter, body_data, "*");
  return result;
});
```

**Security model:**

- Server defines the **maximum scope** (what records can be accessed)
- Client can only **narrow the scope** (filter within allowed records)
- Client **cannot expand the scope** (cannot access records outside server filter)

### When to Use Which Approach

| Use Case                       | Approach         | Example                   |
| ------------------------------ | ---------------- | ------------------------- |
| Public data (no security risk) | Client filter    | Product catalog search    |
| User owns all visible data     | Default endpoint | User's own orders         |
| Permission-sensitive filtering | Custom endpoint  | Public vs. private skills |
| Cross-user visibility          | Custom endpoint  | Marketplace, social feed  |
| Admin-only views               | Custom endpoint  | Admin dashboard           |

## Troubleshooting

### Problem: "No results" but data exists

**Cause:** Client still sending empty search params, server filter too restrictive

**Solution:** Check server filter and client search form:

```typescript
// Debug: Log the filters
router.post("/public", async ({ body }) => {
  console.log("Body:", body); // Check what client sends
  const filter = { is_public: true };
  console.log("Filter:", filter); // Check server filter
  const result = await entity.list_entity(body_data, filter, body_data, "*");
  console.log("Result:", result); // Check query results
  return result;
});
```

### Problem: Pagination not working

**Cause:** Not using `entity.list_entity` or not passing `body_data` correctly

**Solution:** Use the correct pattern:

```typescript
// ✅ CORRECT - Passes body_data for pagination
router.post("/public", async ({ body }) => {
  const body_data = body as Record<string, unknown>;
  const result = await entity.list_entity(
    body_data, // ← Contains page, limit
    filter,
    body_data,
    "*",
  );
  return { ...result };
});
```

### Problem: Sorting not working

**Cause:** Not returning `entity.list_entity` result properly

**Solution:** Spread the result object:

```typescript
// ✅ CORRECT - Spreads the full result
return { ...result };

// ❌ WRONG - Loses pagination metadata
return { code: SUCCESS, data: result.data };
```

### Problem: "Method not allowed" error

**Cause:** Endpoint is GET but client sends POST

**Solution:** Change to POST:

```typescript
// ❌ WRONG
router.get('/public', ...);

// ✅ CORRECT
router.post('/public', ...);
```

## Complete Example: Skill Marketplace

### Server: hola-server/router/skill.ts

```typescript
import { init_router, Entity, code } from "hola-server";
import type { Elysia } from "elysia";

interface SessionUser {
  sub: string;
  role: string | null;
}

const router = init_router({
  collection: "skill",
  user_field: "creator", // Isolates by user
  creatable: true,
  readable: true,
  updatable: true,
  deleteable: true,

  fields: [
    { name: "name", type: "string", required: true },
    { name: "description", type: "text", list: false },
    { name: "category", type: "skill_category", required: true },
    { name: "framework", type: "framework_type" },
    { name: "is_public", type: "boolean", default: false },
    { name: "is_featured", type: "boolean", default: false },
    { name: "creator", ref: "user", required: true },
  ],

  route: (router: Elysia, meta) => {
    const entity = new Entity(meta);

    // Public marketplace - all public skills
    router.post("/public", async ({ body }) => {
      const body_data = body as Record<string, unknown>;

      // Server-enforced: only public skills
      const server_filter: Record<string, unknown> = {
        is_public: true,
      };

      const result = await entity.list_entity(
        body_data,
        server_filter,
        body_data,
        "*",
      );

      return { ...result };
    });

    // User's own skills (my skills view)
    router.post("/my-skills", async ({ user, body }) => {
      const body_data = body as Record<string, unknown>;
      const session_user = user as SessionUser;

      // Server-enforced: only current user's skills
      const server_filter: Record<string, unknown> = {
        creator: session_user?.sub,
      };

      const result = await entity.list_entity(
        body_data,
        server_filter,
        body_data,
        "*",
      );

      return { ...result };
    });

    // Featured skills (curated homepage)
    router.post("/featured", async ({ body }) => {
      const body_data = body as Record<string, unknown>;

      // Server-enforced: public AND featured
      const server_filter: Record<string, unknown> = {
        is_public: true,
        is_featured: true,
      };

      const result = await entity.list_entity(
        body_data,
        server_filter,
        body_data,
        "*",
      );

      return { ...result };
    });

    // Admin view - all skills
    router.post("/admin-all", async ({ user, body }) => {
      const session_user = user as SessionUser;

      // Check admin permission
      if (session_user?.role !== "admin") {
        return { code: code.NO_RIGHTS, err: "Admin access required" };
      }

      const body_data = body as Record<string, unknown>;

      // No filter - admin sees everything
      const server_filter: Record<string, unknown> = {};

      const result = await entity.list_entity(
        body_data,
        server_filter,
        body_data,
        "*",
      );

      return { ...result };
    });
  },
});

export default router;
```

### Client: hola-web/src/views/SkillMarketView.vue

```vue
<template>
  <v-container fluid>
    <h-bread />

    <h-crud
      entity="skill"
      list-action="/public"
      mode="rs"
      :search-cols="6"
      item-label-key="name"
    >
    </h-crud>
  </v-container>
</template>

<script setup lang="ts">
// No additional logic needed - h-crud handles everything
</script>
```

### Client: hola-web/src/views/MySkillsView.vue

```vue
<template>
  <v-container fluid>
    <h-bread />

    <h-crud
      entity="skill"
      list-action="/my-skills"
      mode="cruds"
      :search-cols="6"
      item-label-key="name"
    >
    </h-crud>
  </v-container>
</template>
```

### Client: hola-web/src/views/AdminSkillsView.vue

```vue
<template>
  <v-container fluid>
    <h-bread />

    <h-crud
      entity="skill"
      list-action="/admin-all"
      mode="cruds"
      :search-cols="4"
      item-label-key="name"
    >
    </h-crud>
  </v-container>
</template>
```

## Quick Reference

| Task                   | Code                                                         |
| ---------------------- | ------------------------------------------------------------ |
| Define custom endpoint | `route: (router, meta) => { router.post('/endpoint', ...) }` |
| Use custom endpoint    | `<h-crud list-action="/endpoint">`                           |
| Server filter          | 2nd argument of `entity.list_entity(body, filter, ...)`      |
| Client search          | Merged from `body_data` (3rd argument)                       |
| Public marketplace     | `filter = { is_public: true }`                               |
| User's own items       | `filter = { user_field: user?.sub }`                         |
| Admin view (all)       | `filter = {}`                                                |
| Role-based filter      | Check `user?.role` and set filter accordingly                |

## Related Skills

- **crud-table-list** - Control which fields show as table columns
- **crud-table-search** - Control which fields are searchable
- **crud-create-router** - Customize create forms with complex workflows
- **crud-expand-panel** - Display long text in expandable rows
