---
name: entity-find
description: Use secure Entity find methods with attribute filtering for data privacy. Use when querying MongoDB via Entity class - always specify attrs parameter to limit returned fields instead of exposing entire documents.
---

# Entity Find Methods

Always use attribute filtering to protect data privacy. Never return entire documents to clients.

## Find Methods Reference

| Method        | Signature                                    | Use Case                |
| ------------- | -------------------------------------------- | ----------------------- |
| `find`        | `find(query, attr?)`                         | Multiple docs, no sort  |
| `find_one`    | `find_one(query, attr?)`                     | Single doc by query     |
| `find_sort`   | `find_sort(query, sort, attr?)`              | Multiple docs with sort |
| `find_page`   | `find_page(query, sort, page, limit, attr?)` | Pagination              |
| `find_by_oid` | `find_by_oid(id, attr?)`                     | Single doc by ObjectId  |

## ⚠️ Always Specify Attributes

**Bad (exposes all fields):**

```typescript
const users = await entity.find({ status: 1 });
const project = await entity.find_one({ _id: id });
```

**Good (only needed fields):**

```typescript
const users = await entity.find({ status: 1 }, { _id: 1, name: 1, email: 1 });
const project = await entity.find_one({ _id: id }, { _id: 1, name: 1, budget: 1 });
```

## Common Patterns

### List with Sort

```typescript
// Return only _id and name, sorted by created_at
const items = await entity.find_sort({ owner: userId, status: ACTIVE }, { created_at: -1 }, { _id: 1, name: 1 });
```

### Lookup by ObjectId

```typescript
// Use find_by_oid for single ID lookups
const project = await entity.find_by_oid(projectId, { _id: 1, name: 1, budget: 1 });
```

### Paginated List

```typescript
// Page 1, 20 items per page
const items = await entity.find_page(
  { status: ACTIVE },
  { created_at: -1 },
  1, // page
  20, // limit
  { _id: 1, name: 1, created_at: 1 },
);
```

## Search Patterns for Auditing

Find potential privacy issues in code:

```bash
# Find find_one calls without attrs (entire doc returned)
grep -rn "find_one([^,)]*)" --include="*.ts" source/server/src/router

# Find find calls that might be missing attrs
grep -rn "\.find(" --include="*.ts" source/server/src/router
```

## Sensitive Fields to Exclude

Never return these fields to clients:

- `password` - User passwords
- `llm_api_key` - API keys
- `provider_id` - OAuth provider IDs
- Internal timestamps unless needed
