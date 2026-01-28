---
name: oid-search
description: Find MongoDB ObjectId usage issues in TypeScript router code. Use when auditing database queries for proper _id handling, finding { _id: stringVar } patterns that need oid_query() conversion, or identifying find_one({ _id: ... }) calls that should use find_by_oid().
---

# OID Search

Find and fix MongoDB ObjectId handling issues in hola-server router code.

## Problem

MongoDB `_id` fields are ObjectId types, not strings. When query parameters come from URL params or JWT tokens as strings, they must be converted using `oid_query()` or `find_by_oid()`.

## Search Patterns

### Pattern 1: Direct \_id with string variable

**Find:**

```bash
rg "{ _id: ctx\." --type ts
rg '{ _id: [a-z_]+[,\s}]' --type ts
```

**Bad:**

```typescript
entity.find_one({ _id: ctx.params.id }, { name: 1 });
entity.update({ _id: ctx.user.sub }, { status: 1 });
```

**Good:**

```typescript
entity.find_by_oid(ctx.params.id, { name: 1 });
const oid = entity.oid_query(ctx.params.id);
if (oid) entity.update(oid, { status: 1 });
```

### Pattern 2: Combined \_id + other fields

**Find:**

```bash
rg '_id:.*owner:' --type ts
rg '{ _id: .*, owner:' --type ts
```

**Bad:**

```typescript
entity.find_one({ _id: project_id, owner: ctx.user.sub }, { _id: 1 });
```

**Good:**

```typescript
const oid = entity.oid_query(project_id);
entity.find_one({ ...oid, owner: ctx.user.sub }, { _id: 1 });
```

### Pattern 3: $in with string array

**Find:**

```bash
rg '\$in:.*_id' --type ts
rg '_id:.*\$in' --type ts
```

**Bad:**

```typescript
entity.find({ _id: { $in: string_ids } });
```

**Good:**

```typescript
const oids = entity.oid_queries(string_ids);
entity.find(oids);
```

## Quick Search Script

Run the search script to find all issues:

```bash
./scripts/find_oid_issues.sh <directory>
```

## Fix Patterns

| Original                              | Replacement                                                            |
| ------------------------------------- | ---------------------------------------------------------------------- |
| `entity.find_one({ _id: id }, attrs)` | `entity.find_by_oid(id, attrs)`                                        |
| `entity.update({ _id: id }, data)`    | `const oid = entity.oid_query(id); if (oid) entity.update(oid, data)`  |
| `entity.find_one({ _id: id, owner })` | `const oid = entity.oid_query(id); entity.find_one({ ...oid, owner })` |
| `{ _id: { $in: ids } }`               | `entity.oid_queries(ids)`                                              |
