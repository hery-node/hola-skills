---
name: hola-hooks
description: Lifecycle hooks and custom handlers in Hola framework. Use when adding validation logic, setting default values, implementing custom business rules, accessing authenticated user context, or modifying CRUD operations. Covers before/after hooks, custom handlers, context objects, return values, and common patterns.
---

# Hola Hooks - Lifecycle & Custom Handlers

Complete guide to extending entity behavior with hooks and custom handlers in the Hola framework.

## Hook Types Overview

| Hook Type            | Timing             | Use Case               | Can Modify Data | Can Prevent Operation |
| -------------------- | ------------------ | ---------------------- | --------------- | --------------------- |
| **Lifecycle Hooks**  |
| `before_create`      | Before validation  | Set defaults, validate | ✅ Yes          | ✅ Yes                |
| `after_create`       | After DB insert    | Logging, notifications | ❌ No           | ❌ No                 |
| `before_clone`       | Before validation  | Modify clone data      | ✅ Yes          | ✅ Yes                |
| `after_clone`        | After DB insert    | Post-clone actions     | ❌ No           | ❌ No                 |
| `before_update`      | Before validation  | Validate changes       | ✅ Yes          | ✅ Yes                |
| `after_update`       | After DB update    | Sync, notifications    | ❌ No           | ❌ No                 |
| `before_delete`      | Before deletion    | Check permissions      | ❌ No           | ✅ Yes                |
| `after_delete`       | After deletion     | Cleanup, logging       | ❌ No           | ❌ No                 |
| `after_read`         | After DB read      | Transform data         | ✅ Yes          | ❌ No                 |
| `list_query`         | Before list query  | Modify filter          | ✅ Yes          | ❌ No                 |
| `after_batch_update` | After batch update | Bulk sync              | ❌ No           | ❌ No                 |
| **Custom Handlers**  |
| `create`             | Replaces create    | Custom logic           | ✅ Yes          | ✅ Yes                |
| `clone`              | Replaces clone     | Custom logic           | ✅ Yes          | ✅ Yes                |
| `update`             | Replaces update    | Custom logic           | ✅ Yes          | ✅ Yes                |
| `batch_update`       | Replaces batch     | Custom logic           | ✅ Yes          | ✅ Yes                |
| `delete`             | Replaces delete    | Custom logic           | ✅ Yes          | ✅ Yes                |

## Return Value Format

All hooks must return a `HookResult`:

```typescript
interface HookResult {
  code: number; // 200 = success, other = error
  err?: string | string[]; // Error message(s)
}
```

**Success:**

```typescript
return { code: 0 }; // or { code: 200 }
```

**Error (stop operation):**

```typescript
return { code: 400, err: "Invalid discount rate" };
return { code: 403, err: ["field1", "field2"] }; // Array for multiple errors
```

### Common Error Codes

| Code | Constant           | Meaning                     |
| ---- | ------------------ | --------------------------- |
| 200  | `SUCCESS`          | Operation successful        |
| 400  | `NO_PARAMS`        | Missing required parameters |
| 403  | `NO_RIGHTS`        | Permission denied           |
| 404  | `NOT_FOUND`        | Entity not found            |
| 409  | `DUPLICATE_UNIQUE` | Unique constraint violation |
| 422  | `INVALID_PARAMS`   | Validation failed           |
| 423  | `HAS_REF`          | Has dependent references    |
| 500  | `ERROR`            | Internal server error       |

## Context Objects

### CreateHookContext (create/after_create)

```typescript
interface CreateHookContext {
  entity: Entity; // Entity instance for DB operations
  data: Record<string, unknown>; // Field data being created
}
```

**Access authenticated user:**

```typescript
before_create: async ({ entity, data }) => {
  const user = data._user; // { sub: string, role?: string, ... }
  data.created_by = user?.sub;
  return { code: 0 };
};
```

### CloneHookContext (before_clone/after_clone)

```typescript
interface CloneHookContext {
  id: string; // Source entity ID being cloned
  entity: Entity; // Entity instance
  data: Record<string, unknown>; // Clone data (can be modified)
}
```

### UpdateHookContext (before_update/after_update)

```typescript
interface UpdateHookContext {
  id: string | null; // Entity ID being updated (null for primary key update)
  entity: Entity; // Entity instance
  data: Record<string, unknown>; // Update data
}
```

### BatchUpdateHookContext (batch_update/after_batch_update)

```typescript
interface BatchUpdateHookContext {
  ids: string[]; // Array of entity IDs being updated
  entity: Entity; // Entity instance
  data: Record<string, unknown>; // Update data applied to all
}
```

### DeleteHookContext (before_delete/after_delete)

```typescript
interface DeleteHookContext {
  entity: Entity; // Entity instance
  ids: string[]; // Array of entity IDs being deleted
}
```

### AfterReadHookContext (after_read)

```typescript
interface AfterReadHookContext {
  id: string; // Entity ID being read
  entity: Entity; // Entity instance
  attrNames: string; // Requested field names
  result: Record<string, unknown>; // Entity data (can be modified)
}
```

### ListQueryHookContext (list_query)

```typescript
interface ListQueryHookContext {
  entity: Entity; // Entity instance
  query: Record<string, unknown>; // MongoDB query (can be modified)
}
```

## Lifecycle Hooks

### 1. before_create

Set defaults, validate business rules, or prevent creation.

```typescript
export const router = init_router({
  collection: "order",
  creatable: true,

  before_create: async ({ entity, data }) => {
    // Access authenticated user
    const user = data._user;

    // Set computed fields
    data.order_number = `ORD-${Date.now()}`;
    data.created_by = user?.sub;
    data.created_at = new Date();

    // Validate business rules
    if (data.discount > 50) {
      return { code: 422, err: "Discount cannot exceed 50%" };
    }

    // Set default status
    if (!data.status) {
      data.status = 0; // Pending
    }

    return { code: 0 };
  },
});
```

**Processing Order:**

1. Router applies `field.default` values
2. Router sets `user_field` if defined
3. **before_create runs** ← Can modify data
4. Type validation happens
5. Required field validation
6. DB insert
7. after_create runs

### 2. after_create

Logging, notifications, or side effects after successful creation.

```typescript
{
  after_create: async ({ entity, data }) => {
    // Send notification
    await sendEmail({
      to: data.email,
      subject: "Account Created",
      body: `Welcome ${data.name}!`,
    });

    // Log audit trail
    await entity.db.create("audit_log", {
      action: "create",
      entity: entity.meta.collection,
      user: data._user?.sub,
    });

    return { code: 0 };
  };
}
```

**⚠️ Note:** Cannot modify `data` - already inserted to DB.

### 3. before_clone

Modify clone data before creating new entity.

```typescript
{
  before_clone: async ({ id, entity, data }) => {
    // Read source entity if needed
    const source = await entity.find({ _id: id });

    // Modify cloned data
    data.title = `Copy of ${data.title || source[0]?.title}`;
    data.status = 0; // Reset to pending
    data.created_at = new Date();

    // Remove fields that shouldn't be cloned
    delete data.approval_date;
    delete data.completion_date;

    return { code: 0 };
  };
}
```

### 4. after_clone

Post-clone actions (e.g., copy related entities).

```typescript
{
  after_clone: async ({ id, entity, data }) => {
    // Clone related entities
    const taskEntity = new Entity(get_entity_meta("task"));
    const tasks = await taskEntity.find({ project_id: id });

    for (const task of tasks) {
      await taskEntity.create({
        ...task,
        project_id: data._id, // New cloned project ID
        status: 0,
      });
    }

    return { code: 0 };
  };
}
```

### 5. before_update

Validate updates or prevent modifications.

```typescript
{
  before_update: async ({ id, entity, data }) => {
    // Read current entity
    const current = await entity.find({ _id: id });
    if (!current.length) {
      return { code: 404, err: "Entity not found" };
    }

    // Prevent status downgrade
    if (data.status < current[0].status) {
      return { code: 403, err: "Cannot downgrade status" };
    }

    // Set updated timestamp
    data.updated_at = new Date();
    data.updated_by = data._user?.sub;

    // Validate state transitions
    if (current[0].locked && data.amount) {
      return { code: 423, err: "Cannot modify amount - record is locked" };
    }

    return { code: 0 };
  };
}
```

### 6. after_update

Sync changes or trigger workflows.

```typescript
{
  after_update: async ({ id, entity, data }) => {
    // Trigger workflow on status change
    if (data.status === 2) {
      // Approved
      await triggerApprovalWorkflow(id);
    }

    // Invalidate cache
    await redis.del(`entity:${id}`);

    // Sync to external system
    await syncToExternalAPI(id, data);

    return { code: 0 };
  };
}
```

### 7. before_delete

Prevent deletion based on conditions.

```typescript
{
  before_delete: async ({ entity, ids }) => {
    // Check if any records are locked
    const records = await entity.find({
      _id: { $in: ids.map((id) => new ObjectId(id)) },
    });

    const locked = records.filter((r) => r.locked);
    if (locked.length > 0) {
      return {
        code: 423,
        err: `Cannot delete locked records: ${locked.map((r) => r.title).join(", ")}`,
      };
    }

    // Check permissions
    const user = data._user;
    if (user?.role !== "admin") {
      return { code: 403, err: "Only admins can delete" };
    }

    return { code: 0 };
  };
}
```

### 8. after_delete

Cleanup or logging after deletion.

```typescript
{
  after_delete: async ({ entity, ids }) => {
    // Delete associated files
    for (const id of ids) {
      await deleteFiles(entity.meta.collection, id);
    }

    // Log deletion
    await logAudit({
      action: "delete",
      entity: entity.meta.collection,
      ids,
    });

    return { code: 0 };
  };
}
```

### 9. after_read

Transform or enrich data after reading.

```typescript
{
  after_read: async ({ id, entity, attrNames, result }) => {
    // Add computed fields
    if (result.price && result.tax_rate) {
      result.total = result.price * (1 + result.tax_rate / 100);
    }

    // Mask sensitive data based on user role
    const user = data._user;
    if (user?.role !== "admin") {
      delete result.internal_notes;
      result.ssn = result.ssn?.replace(/\d(?=\d{4})/g, "*");
    }

    // Fetch additional data
    result.view_count = await getViewCount(id);

    return { code: 0 };
  };
}
```

### 10. list_query

Modify search query before execution.

```typescript
{
  list_query: async ({ entity, query }) => {
    // Add default filter
    const user = data._user;
    if (user?.role !== "admin") {
      query.published = true; // Non-admins only see published
    }

    // Add tenant isolation
    query.tenant_id = user?.tenant_id;

    // Modify date range
    if (query.created_at) {
      query.created_at = {
        $gte: new Date(query.created_at),
        $lt: new Date(Date.now()),
      };
    }

    return { code: 0 };
  };
}
```

### 11. after_batch_update

Actions after batch update completes.

```typescript
{
  after_batch_update: async ({ ids, entity, data }) => {
    // Invalidate cache for all updated records
    for (const id of ids) {
      await redis.del(`entity:${id}`);
    }

    // Trigger bulk sync
    await bulkSyncToWarehouse(entity.meta.collection, ids);

    return { code: 0 };
  };
}
```

## Custom Handlers

Replace default CRUD operations with custom logic.

### create - Custom Create Handler

```typescript
{
  create: async ({ entity, data }) => {
    // Custom validation
    if (!isValidBusinessRule(data)) {
      return { code: 422, err: "Business rule violation" };
    }

    // Custom ID generation
    data._id = await generateCustomId(entity.meta.collection);

    // Multi-collection transaction
    const session = await entity.db.client.startSession();
    try {
      await session.withTransaction(async () => {
        await entity.create(data);
        await entity.db.create("audit_log", {
          entity_id: data._id,
          action: "created",
        });
      });
      return { code: 0 };
    } catch (err) {
      return { code: 500, err: err.message };
    } finally {
      await session.endSession();
    }
  };
}
```

**⚠️ IMPORTANT:** When you define a custom handler, the default operation is **completely replaced**. You must handle:

- Database insertion
- Validation
- Error handling

### update - Custom Update Handler

```typescript
{
  update: async ({ id, entity, data }) => {
    // Custom partial update logic
    const current = await entity.find({ _id: id });
    if (!current.length) {
      return { code: 404, err: "Not found" };
    }

    // Apply custom merge strategy
    const merged = customMerge(current[0], data);

    // Update with custom query
    await entity.update({ _id: id }, merged);

    return { code: 0 };
  };
}
```

### delete - Custom Delete Handler

```typescript
{
  delete: async ({ entity, ids }) => {
    // Soft delete instead of hard delete
    await entity.update(
      { _id: { $in: ids } },
      {
        deleted: true,
        deleted_at: new Date(),
        deleted_by: data._user?.sub
      }
    );

    return { code: 0 };
  }
}
```

### batch_update - Custom Batch Handler

```typescript
{
  batch_update: async ({ ids, entity, data }) => {
    // Custom batch logic with progress tracking
    let processed = 0;

    for (const id of ids) {
      await entity.update({ _id: id }, data);
      processed++;
      await updateProgress(processed / ids.length);
    }

    return { code: 0 };
  };
}
```

### clone - Custom Clone Handler

```typescript
{
  clone: async ({ id, entity, data }) => {
    // Read source
    const source = await entity.find({ _id: id });
    if (!source.length) {
      return { code: 404, err: "Source not found" };
    }

    // Deep clone with related entities
    const cloned = await deepCloneWithRelations(source[0], data);
    await entity.create(cloned);

    return { code: 0 };
  };
}
```

## Accessing Entity Database Operations

The `entity` parameter provides access to low-level DB operations:

```typescript
{
  before_create: async ({ entity, data }) => {
    // Query operations
    const exists = await entity.find({ email: data.email });
    const count = await entity.count({ status: 1 });

    // Direct DB access
    await entity.create({ ...data });
    await entity.update({ _id: id }, { updated: true });
    await entity.delete({ _id: id });

    // Access meta information
    const collection = entity.meta.collection;
    const fields = entity.meta.fields;

    return { code: 0 };
  };
}
```

## User Context Access

All hooks receive authenticated user via `data._user`:

```typescript
{
  before_create: async ({ entity, data }) => {
    const user = data._user as {
      sub: string; // User ID
      role?: string; // User role
      email?: string; // User email
      // ... other JWT claims
    };

    // Set ownership
    data.owner = user.sub;

    // Role-based defaults
    if (user.role === "admin") {
      data.auto_approve = true;
    }

    return { code: 0 };
  };
}
```

**⚠️ Note:** `_user` is automatically removed before DB save - don't include it in your data schema.

## Common Patterns

### Pattern 1: Auto-Increment Field

```typescript
{
  before_create: async ({ entity, data }) => {
    const lastRecord = await entity.find({}, { order_number: 1 }, { sort: { order_number: -1 }, limit: 1 });

    data.order_number = lastRecord.length ? lastRecord[0].order_number + 1 : 1000;

    return { code: 0 };
  };
}
```

### Pattern 2: Audit Trail

```typescript
{
  before_create: async ({ entity, data }) => {
    data.created_at = new Date();
    data.created_by = data._user?.sub;
    return { code: 0 };
  },

  before_update: async ({ entity, data }) => {
    data.updated_at = new Date();
    data.updated_by = data._user?.sub;
    return { code: 0 };
  }
}
```

### Pattern 3: Cascade Update Related Entities

```typescript
{
  after_update: async ({ id, entity, data }) => {
    if (data.status) {
      // Update all child tasks
      const taskEntity = new Entity(get_entity_meta("task"));
      await taskEntity.update({ project_id: id }, { parent_status: data.status });
    }
    return { code: 0 };
  };
}
```

### Pattern 4: Validation with External Service

```typescript
{
  before_create: async ({ entity, data }) => {
    // Validate with external API
    const isValid = await validateWithExternalAPI(data.code);
    if (!isValid) {
      return { code: 422, err: "Invalid code verification" };
    }
    return { code: 0 };
  };
}
```

### Pattern 5: Conditional Field Requirements

```typescript
{
  before_create: async ({ entity, data }) => {
    if (data.type === "premium" && !data.subscription_id) {
      return { code: 400, err: "subscription_id required for premium type" };
    }
    return { code: 0 };
  };
}
```

### Pattern 6: File Upload Handling

```typescript
{
  after_create: async ({ entity, data }) => {
    if (data.file_id) {
      await processFile(data.file_id);
      await generateThumbnail(data.file_id);
    }
    return { code: 0 };
  },

  after_delete: async ({ entity, ids }) => {
    const records = await entity.find({ _id: { $in: ids } });
    for (const record of records) {
      if (record.file_id) {
        await deleteFile(record.file_id);
      }
    }
    return { code: 0 };
  }
}
```

## Hook Execution Order

### Create Operation

1. Router applies `default` values
2. Router sets `user_field`
3. **before_create** ← Can modify data
4. Type conversion & validation
5. Required field validation
6. Primary key uniqueness check
7. Reference validation
8. **create** handler (if defined) OR default DB insert
9. **after_create**

### Update Operation

1. **before_update** ← Can modify data
2. Type conversion & validation
3. Reference validation
4. **update** handler (if defined) OR default DB update
5. **after_update**

### Delete Operation

1. **before_delete** ← Can prevent deletion
2. **delete** handler (if defined) OR default deletion with cascade
3. **after_delete**

### Clone Operation

1. Read source entity
2. Copy `clone_fields` (where `clone !== false`)
3. Apply overrides from request body
4. Router sets `user_field`
5. **before_clone** ← Can modify data
6. Type conversion & validation
7. Required field validation
8. **clone** handler (if defined) OR default DB insert
9. **after_clone**

### Read Operation

1. DB query
2. **after_read** ← Can modify result
3. Link field population
4. Ref field conversion
5. Return to client

## Best Practices

### 1. ✅ Always Return HookResult

```typescript
// ✅ Good
before_create: async ({ data }) => {
  data.created_at = new Date();
  return { code: 0 };
};

// ❌ Bad - no return value
before_create: async ({ data }) => {
  data.created_at = new Date();
};
```

### 2. ✅ Use Type-Safe Context

```typescript
// ✅ Good - destructure context
before_create: async ({ entity, data }) => {
  const user = data._user as JwtPayload;
  // ...
};

// ❌ Bad - using ctx directly
before_create: async (ctx) => {
  const entity = ctx.entity; // Less clear
};
```

### 3. ✅ Handle Errors Gracefully

```typescript
// ✅ Good
before_create: async ({ data }) => {
  try {
    await externalValidation(data);
    return { code: 0 };
  } catch (err) {
    return { code: 500, err: err.message };
  }
};
```

### 4. ✅ Don't Modify Data in after\_ Hooks

```typescript
// ❌ Bad - data already in DB
after_create: async ({ data }) => {
  data.status = 1; // Won't be saved!
  return { code: 0 };
};

// ✅ Good - use update if needed
after_create: async ({ entity, data }) => {
  if (needsUpdate) {
    await entity.update({ _id: data._id }, { status: 1 });
  }
  return { code: 0 };
};
```

### 5. ✅ Use Custom Handlers Sparingly

```typescript
// ✅ Good - use before_create for simple logic
before_create: async ({ data }) => {
  data.slug = slugify(data.title);
  return { code: 0 };
};

// ❌ Bad - unnecessary custom handler
create: async ({ entity, data }) => {
  data.slug = slugify(data.title);
  await entity.create(data); // Just use before_create!
  return { code: 0 };
};
```

## Debugging Hooks

Hooks log errors automatically:

```
[ERROR] before_create error - err: "Invalid discount", code: 422
```

Add your own logging:

```typescript
{
  before_create: async ({ data }) => {
    console.log("[DEBUG] Creating entity:", data);

    if (someCondition) {
      console.error("[ERROR] Validation failed");
      return { code: 422, err: "Validation failed" };
    }

    return { code: 0 };
  };
}
```

## Related Skills

- `hola-meta` - Define entities with hook support
- `hola-router` - Auto-generated endpoints that trigger hooks
- `entity-find` - Entity layer DB operations available in hooks

## Complete Example

```typescript
import { init_router, Entity, get_entity_meta, SUCCESS } from "hola-server";

export const router = init_router({
  collection: "order",
  primary_keys: ["order_number"],
  user_field: "owner",

  creatable: true,
  readable: true,
  updatable: true,
  deleteable: true,

  fields: [
    { name: "order_number", type: "string", required: true, create: false },
    { name: "customer", ref: "customer", required: true },
    { name: "total", type: "currency", required: true },
    { name: "status", type: "order_status", default: 0 },
    { name: "owner", sys: true },
    { name: "created_at", sys: true },
    { name: "updated_at", sys: true },
  ],

  before_create: async ({ entity, data }) => {
    // Generate order number
    const lastOrder = await entity.find({}, { order_number: 1 }, { sort: { order_number: -1 }, limit: 1 });
    data.order_number = lastOrder.length ? `ORD-${parseInt(lastOrder[0].order_number.split("-")[1]) + 1}` : "ORD-1000";

    // Set timestamps
    data.created_at = new Date();
    data.owner = data._user?.sub;

    // Validate minimum order
    if (data.total < 10) {
      return { code: 422, err: "Minimum order is $10" };
    }

    return { code: 0 };
  },

  after_create: async ({ entity, data }) => {
    // Send confirmation email
    await sendOrderConfirmation(data.order_number);
    return { code: 0 };
  },

  before_update: async ({ id, entity, data }) => {
    data.updated_at = new Date();

    // Prevent status downgrade
    const current = await entity.find({ _id: id });
    if (current[0].status > data.status) {
      return { code: 403, err: "Cannot downgrade order status" };
    }

    return { code: 0 };
  },

  after_update: async ({ id, entity, data }) => {
    // Trigger fulfillment on status change
    if (data.status === 2) {
      // Approved
      await triggerFulfillment(id);
    }
    return { code: 0 };
  },

  before_delete: async ({ entity, ids }) => {
    // Only admins can delete
    const user = data._user;
    if (user?.role !== "admin") {
      return { code: 403, err: "Only admins can delete orders" };
    }
    return { code: 0 };
  },
});
```
