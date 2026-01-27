# Eden Treaty Skill

Type-safe API client using ElysiaJS Eden Treaty for end-to-end type safety between client and server.

## Overview

Eden Treaty provides compile-time type safety for API calls by inferring types directly from the Elysia server's type signature. This eliminates manual type assertions and provides full auto-completion in the IDE.

## When to Use Eden vs Axios

| Use Case                                                | Recommended Client                 |
| ------------------------------------------------------- | ---------------------------------- |
| **Library components** (DataTable, EditForm, CrudTable) | Axios (`listEntity`, `saveEntity`) |
| **Consumer app with known entities**                    | Eden Treaty                        |
| **Custom components for specific entities**             | Eden Treaty                        |
| **Dynamic entity name from props**                      | Axios                              |
| **Type-safe direct API calls**                          | Eden Treaty                        |

### Why This Distinction?

Library components use **runtime entity strings** (e.g., `props.entity = "user"`), which cannot benefit from Eden's compile-time type inference. Eden requires the entity path to be known at compile time:

```typescript
// ❌ Cannot work with Eden - entity is a runtime variable
const data = await api[props.entity].get(); // TypeScript doesn't know the type

// ✅ Works with Eden - explicit entity at compile time
const data = await api.user.get(); // Full type inference
```

## Setup

### Server Side (Required)

Export the App type from your server's main file:

```typescript
import { Elysia } from "elysia";
import { init_router } from "hola-server";

const userRouter = init_router({
  collection: "user",
  fields: [{ name: "name", required: true }],
  // ...other config
});

const app = new Elysia().use(userRouter).listen(3000);

// ⭐ Export this type for Eden clients
export type App = typeof app;
```

### Client Side

```typescript
import type { App } from "your-server/main";
import { initEden, handleEdenResponse } from "hola-web";

// Initialize once at app startup
const api = initEden<App>({ baseUrl: "http://localhost:3000" });

// Make type-safe calls
const result = await api.user.meta.get();
const data = handleEdenResponse(result);
```

## API Reference

### `initEden<App>(config, handler?)`

Initialize the Eden Treaty client.

| Parameter        | Type              | Description               |
| ---------------- | ----------------- | ------------------------- |
| `config.baseUrl` | `string`          | Server base URL           |
| `handler`        | `ResponseHandler` | Optional response handler |

Returns: Type-safe Eden client

### `getEden<App>()`

Get the previously initialized client (throws if not initialized).

### `getBaseUrl()`

Get the configured base URL.

### `handleEdenResponse<T>(response)`

Handle Eden response with type narrowing:

```typescript
const result = await api.user.get();
const data = handleEdenResponse(result); // Throws on error, returns data on success
```

## Usage Patterns

### List Entities (POST)

```typescript
// List entities - uses POST /list
const users = await api.user.list.post({
  _query: { page: 1, limit: 10 },
});
```

### GET Request

```typescript
// Get entity by ID
const user = await api.user({ id: "123" }).get();

// Get metadata
const meta = await api.user.meta.get();
```

### POST Request

```typescript
// Create entity
const result = await api.user.post({
  name: "John",
  email: "john@example.com",
});
```

### PUT Request

```typescript
// Update entity
const result = await api.user({ id: "123" }).put({
  name: "Updated Name",
});
```

### DELETE Request

```typescript
// Delete entity
const result = await api.user({ id: "123" }).delete();
```

## Comparison: Axios vs Eden

### Before (Axios)

```typescript
import { listEntity, isSuccessResponse } from "hola-web";

// Manual type assertion, string URL construction
const result = await listEntity<User>("user", {}, { page: 1, limit: 10 });

if (isSuccessResponse(result.code)) {
  const users = result.data; // Type is User[] but not validated
}
```

### After (Eden)

```typescript
import type { App } from "your-server/main";
import { initEden, handleEdenResponse } from "hola-web";

const api = initEden<App>({ baseUrl: "..." });

// Full auto-complete, types flow from server
// List uses POST /list endpoint
const result = await api.user.list.post({
  _query: { page: 1, limit: 10 },
});

const data = handleEdenResponse(result); // Type inferred automatically
```

## Best Practices

1. **Keep one Eden client instance** - Initialize once in your app entry and reuse via `getEden()`

2. **Use Eden for known entities** - When you know the entity at compile time, prefer Eden

3. **Use Axios for dynamic cases** - Library components and dynamic entity names should use axios functions

4. **Type the server export** - Always export `type App = typeof app` from your server

5. **Handle errors properly** - Use `handleEdenResponse()` or check `result.error` before accessing `result.data`
