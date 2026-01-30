---
name: h-crud
description: CRUD data table components (CrudTable, DataTable) in Hola web framework. Use when building entity list/search views, implementing create/update/delete operations, customizing table actions/toolbars, handling pagination/infinite scroll, or integrating with server metadata. See references/ for detailed documentation.
---

# H-CRUD - Data Table Components

Build CRUD interfaces with CrudTable and DataTable components in Hola web framework.

## Component Overview

| Component     | Purpose                  | Key Features                             |
| ------------- | ------------------------ | ---------------------------------------- |
| **CrudTable** | Full CRUD operations     | Create, Update, Delete, Batch, Shortcuts |
| **DataTable** | Read-only or custom list | Search, Infinite scroll, Custom actions  |

## Quick Start

### 1. Initialize Axios

```typescript
import { initAxios } from "@/core/axios";

initAxios({ baseURL: "http://localhost:3000" });
```

### 2. Basic CrudTable

```vue
<template>
  <CrudTable entity="user" :sort-key="['created_at']" :sort-desc="[true]" item-label-key="name" />
</template>

<script setup lang="ts">
import { CrudTable } from "@/components";
</script>
```

**That's it!** CrudTable automatically fetches metadata, displays searchable table, and handles all CRUD operations.

### 3. Basic DataTable

```vue
<template>
  <DataTable entity="log" :headers="headers" searchable infinite />
</template>

<script setup lang="ts">
import { DataTable } from "@/components";
import type { TableHeader } from "@/components";

const headers: TableHeader[] = [
  { title: "Time", key: "timestamp", sortable: true },
  { title: "Message", key: "message" },
];
</script>
```

## Documentation Structure

### Quick Reference

- **[Props Reference](references/props.md)** - Complete prop documentation for CrudTable and DataTable
- **[Customization Guide](references/customization.md)** - Mode characters, custom actions, toolbars, headers, expandable rows, chip editing
- **[Advanced Topics](references/advanced.md)** - Meta fetching, CRUD operations, filter prop, i18n, error handling, performance tips
- **[Common Patterns](references/patterns.md)** - Real-world examples and complete implementations

### When to Read What

**Starting out?**

- Read [Quick Start](#quick-start) above
- Check [Common Patterns](references/patterns.md) for similar use cases

**Need specific feature?**

- **Props**: See [Props Reference](references/props.md)
- **Actions/Toolbars**: See [Customization Guide](references/customization.md)
- **Filtering/Metadata**: See [Advanced Topics](references/advanced.md)

**Building complex UI?**

- Review [Complete Example](references/patterns.md#complete-example-full-featured-user-management)
- Check [Customization Guide](references/customization.md) for all options

## Essential Concepts

### Mode Characters (CrudTable)

Control operations with mode string: `c` (create), `r` (refresh), `s` (search), `u` (update), `d` (delete), `b` (batch), `o` (clone), `p` (pagination).

```vue
<CrudTable entity="user" mode="crsud" ... />
<!-- Full CRUD, no batch -->
<CrudTable entity="log" mode="rs" ... />
<!-- Read-only with search -->
```

**Keyboard shortcuts**: Alt+C (create), Alt+R (refresh), Alt+B (batch)

See [Mode Characters](references/customization.md#mode-characters) for details.

### Infinite Scroll (Recommended)

```vue
<!-- ✅ Recommended - infinite scroll (default) -->
<DataTable entity="logs" :headers="headers" infinite />

<!-- ⚠️ Only if pagination required -->
<CrudTable entity="reports" mode="crsudp" ... />
```

Better UX, faster performance. See [Infinite Scroll vs Pagination](references/advanced.md#performance-tips).

### mergeWithServer

Controls server vs custom field priority:

- **`true` (CrudTable default)**: Shows all server fields, server properties override custom
- **`false` (DataTable default)**: Shows only custom fields, custom properties override server

```vue
<!-- Show all server-defined fields -->
<CrudTable entity="user" :merge-with-server="true" ... />

<!-- Show only custom fields -->
<DataTable entity="log" :merge-with-server="false" :headers="customHeaders" />
```

See [mergeWithServer](references/advanced.md#mergewithserver) for details.

### filter Prop

Permanent server-side filters merged with search:

```vue
<!-- Project-scoped data -->
<CrudTable entity="tasks" :filter="{ project: currentProject._id }" ... />

<!-- Permission-based filtering -->
<CrudTable entity="documents" :filter="{ tenant: currentTenant._id }" ... />
```

See [Filter Prop](references/advanced.md#filter-prop) for patterns.

## Best Practices

1. **✅ Always specify sort**: `sort-key` and `sort-desc` required
2. **✅ Use meaningful itemLabelKey**: Show user-friendly field in delete confirmation
3. **✅ Prefer infinite scroll**: Better UX than pagination
4. **✅ Let server define fields**: Use `mergeWithServer: true` when possible
5. **✅ Use filter for permanent constraints**: Project scope, permissions, soft-delete

## Related Skills

- `hola-router` - Server-side API endpoints
- `hola-meta` - Entity metadata structure
- `add-meta-type` - Custom type definitions
- `i18n` - Internationalization
