# Customization Guide

Complete guide to customizing CrudTable and DataTable appearance and behavior.

## Table of Contents

- [Mode Characters](#mode-characters)
- [Custom Row Actions](#custom-row-actions)
- [Custom Toolbars](#custom-toolbars)
- [Field Customization](#field-customization)
- [Header Customization](#header-customization)
- [Expandable Rows](#expandable-rows)
- [Chip Field Editing](#chip-field-editing)
- [Styling & Theming](#styling--theming)

---

## Mode Characters

The `mode` prop controls which operations are available in CrudTable using a string of character flags.

**Important:** Mode is primarily defined by the server based on permissions and entity configuration. When specified on the client, it can **only restrict** the server's mode, not expand it. For example, if the server allows `crsud` but the client specifies `rs`, only read and search will be available. However, if the server allows `rs` and the client specifies `crsud`, only `rs` will be available.

### Available Mode Characters

| Char | Operation    | UI Element                                         |
| ---- | ------------ | -------------------------------------------------- |
| `c`  | Create       | ➕ Create button (Alt+C shortcut)                  |
| `r`  | Read/Refresh | 🔄 Refresh button (Alt+R shortcut)                 |
| `s`  | Search       | Search form in toolbar                             |
| `u`  | Update       | ✏️ Edit action per row                             |
| `d`  | Delete       | 🗑️ Delete action per row                           |
| `b`  | Batch delete | ☑️ Batch Mode button (Alt+B shortcut)              |
| `o`  | Clone        | 📋 Clone action per row                            |
| `p`  | Pagination   | Footer pagination (not recommended - use infinite) |

### Common Mode Combinations

```vue
<!-- Full CRUD with infinite scroll (recommended) -->
<CrudTable entity="user" mode="crsud" ... />

<!-- Full CRUD with batch delete and clone -->
<CrudTable entity="product" mode="crsudb o" ... />

<!-- Read-only with search -->
<CrudTable entity="log" mode="rs" ... />

<!-- Full CRUD with pagination (not recommended) -->
<CrudTable entity="legacy" mode="crsudp" ... />
```

### Keyboard Shortcuts

When mode includes:

- `c`: **Alt+C** opens Create dialog
- `r`: **Alt+R** refreshes table
- `b`: **Alt+B** toggles Batch mode

---

## Custom Row Actions

Add custom action buttons that appear for each row in the table.

### Basic Row Action

```vue
<template>
  <CrudTable entity="order" :sort-key="['created_at']" :sort-desc="[true]" item-label-key="order_number" :actions="customActions" />
</template>

<script setup lang="ts">
import type { ItemAction } from "@/components";

const customActions: ItemAction[] = [
  {
    icon: "mdi-send",
    color: "primary",
    tooltip: "Send Email",
    handle: async (item) => {
      await sendEmail(item._id);
      // Table refreshes automatically on success
    },
  },
];
</script>
```

### Conditional Actions

Show/hide actions based on item data:

```vue
<script setup lang="ts">
const customActions: ItemAction[] = [
  {
    icon: "mdi-check-circle",
    color: "success",
    tooltip: "Approve",
    handle: async (item) => {
      await approveOrder(item._id);
    },
    shown: (item) => item.status === 0, // Only show for pending orders
  },
  {
    icon: "mdi-cancel",
    color: "error",
    tooltip: "Reject",
    handle: async (item) => {
      await rejectOrder(item._id);
    },
    shown: (item) => item.status === 0, // Only show for pending orders
  },
  {
    icon: "mdi-eye",
    tooltip: "View Details",
    handle: (item) => {
      router.push(`/orders/${item._id}`);
    },
    shown: (item) => item.status > 0, // Only show after processing
  },
];
</script>
```

### Actions with Loading Animation

```vue
<script setup lang="ts">
const customActions: ItemAction[] = [
  {
    icon: "mdi-sync",
    tooltip: "Sync to External System",
    handle: async (item) => {
      await syncToERP(item._id);
    },
    animate: true, // Shows loading spinner during execution
  },
];
</script>
```

### Action Position

```vue
<!-- Place custom actions before default actions -->
<CrudTable entity="task" :actions="customActions" :my-action-first="true" ... />
```

---

## Custom Toolbars

Add custom buttons to the table toolbar for global operations.

### Regular Toolbar Buttons

```vue
<template>
  <CrudTable entity="product" :sort-key="['sku']" :sort-desc="[false]" item-label-key="name" :toolbars="customToolbars" />
</template>

<script setup lang="ts">
import type { ToolbarAction } from "@/components";

const customToolbars: ToolbarAction[] = [
  {
    icon: "mdi-download",
    color: "primary",
    tooltip: "Export CSV",
    click: () => {
      exportToCSV();
    },
  },
  {
    icon: "mdi-upload",
    tooltip: "Import Products",
    click: () => {
      openImportDialog();
    },
  },
  {
    icon: "mdi-cog",
    tooltip: "Settings",
    click: () => {
      openSettingsDialog();
    },
  },
];
</script>
```

### Batch Mode Toolbars

Special toolbar buttons that only appear when batch mode is active:

```vue
<template>
  <CrudTable entity="user" mode="crsudbo" :batch-toolbars="batchToolbars" ... />
</template>

<script setup lang="ts">
const batchToolbars: ToolbarAction[] = [
  {
    icon: "mdi-tag-multiple",
    tooltip: "Bulk Tag",
    click: () => {
      bulkTagSelected();
    },
  },
  {
    icon: "mdi-email-multiple",
    color: "primary",
    tooltip: "Email Selected",
    click: () => {
      emailSelectedUsers();
    },
  },
  {
    icon: "mdi-account-convert",
    tooltip: "Change Role",
    click: () => {
      bulkChangeRole();
    },
  },
];
</script>
```

---

## Field Customization

Control which fields appear in search and edit forms.

### Override Search Fields

```vue
<template>
  <CrudTable entity="user" :search-fields="['email', 'name', 'status', 'role']" ... />
</template>
```

### Override Edit Fields

```vue
<template>
  <CrudTable entity="user" :edit-fields="editFields" ... />
</template>

<script setup lang="ts">
const editFields = [{ name: "email", required: true }, { name: "name", required: true }, { name: "phone" }, { name: "role", default: 0 }, { name: "active", default: true }, { name: "department" }];
</script>
```

### Different Fields for Create vs Update

Use `createView` and `updateView`:

```vue
<template>
  <CrudTable entity="product" create-view="basic" update-view="full" ... />
</template>
```

Server defines:

```javascript
fields: [
  { name: "sku", view: "*" }, // In both views
  { name: "name", view: "*" }, // In both views
  { name: "price", view: "basic" }, // Only in basic (create)
  { name: "cost", view: "full" }, // Only in full (update)
  { name: "margin", view: "full" }, // Only in full (update)
];
```

---

## Header Customization

Define custom column headers with formatting and styling.

### Basic Headers

```vue
<template>
  <CrudTable entity="product" :headers="customHeaders" ... />
</template>

<script setup lang="ts">
import type { TableHeader } from "@/components";

const customHeaders: TableHeader[] = [
  { title: "SKU", key: "sku", sortable: true, width: "150px" },
  { title: "Product Name", key: "name", sortable: true },
  { title: "Price", key: "price", align: "end", width: "120px" },
  { title: "Stock", key: "stock", align: "center", width: "100px" },
  { title: "Category", key: "category", sortable: false },
];
</script>
```

### Column Alignment

```typescript
const headers: TableHeader[] = [
  { title: "Name", key: "name", align: "start" }, // Left-aligned
  { title: "Status", key: "status", align: "center" }, // Center-aligned
  { title: "Price", key: "price", align: "end" }, // Right-aligned
];
```

### Hide Columns

```vue
<CrudTable entity="product" :hide-columns="['internal_code', 'cost_price', 'supplier_id']" ... />
```

---

## Expandable Rows

Show verbose content in an expandable detail area below each row.

### Basic Expandable Fields

```vue
<template>
  <CrudTable entity="order" :expand-fields="['notes', 'shipping_address', 'billing_address']" ... />
</template>
```

### Custom Expand Rendering

Use the `expand` function in headers to render custom HTML:

```vue
<template>
  <CrudTable entity="project" :expand-fields="['description', 'created_at']" :headers="headers" ... />
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const headers = [
  {
    name: "description",
    expand: (value: string) => `
      <tr>
        <td style="padding: 8px; font-weight: bold; width: 120px;">${t("project.description")}</td>
        <td style="padding: 8px; white-space: pre-wrap;">${value || t("common.no_data")}</td>
      </tr>
    `,
  },
  {
    name: "created_at",
    expand: (value: string) => {
      const formatDate = (dateStr: string) => {
        if (!dateStr) return "";
        const d = new Date(dateStr);
        return d.toLocaleString();
      };
      return `
        <tr>
          <td style="padding: 8px; font-weight: bold; width: 120px;">${t("project.created_at")}</td>
          <td style="padding: 8px;">${value ? formatDate(value) : t("common.no_data")}</td>
        </tr>
      `;
    },
  },
];
</script>
```

### Multi-Column Layout in Expanded Rows

Create complex layouts like data tables:

```vue
<script setup lang="ts">
const headers = [
  {
    name: "models",
    expand: (value: string) => {
      if (!value) return `<tr><td style="padding: 8px;">${t("common.no_data")}</td></tr>`;

      // Parse JSON array
      let models: string[] = [];
      try {
        models = JSON.parse(value);
      } catch {
        models = [value];
      }

      if (models.length === 0) {
        return `<tr><td style="padding: 8px;">${t("common.no_data")}</td></tr>`;
      }

      // Create 6-column table layout
      const cols = 6;
      const rows: string[] = [];
      for (let i = 0; i < models.length; i += cols) {
        const rowCells = models.slice(i, i + cols).map((model) => `<td style="padding: 4px 8px; font-family: monospace; font-size: 12px;">${model}</td>`);

        while (rowCells.length < cols) {
          rowCells.push('<td style="padding: 4px 8px;"></td>');
        }
        rows.push(`<tr>${rowCells.join("")}</tr>`);
      }

      return `
        <tr>
          <td colspan="100%" style="padding: 8px;">
            <div style="font-weight: bold; margin-bottom: 8px;">${t("provider.models")} (${models.length})</div>
            <table style="width: 100%; border-collapse: collapse;">
              ${rows.join("")}
            </table>
          </td>
        </tr>
      `;
    },
  },
];
</script>
```

### Expand Best Practices

- Use for verbose content (descriptions, JSON arrays, long text)
- Provide `expand` function for custom HTML formatting
- Use `colspan="100%"` to span full table width
- Include fallback text for empty values
- Use inline styles for consistent rendering
- Consider mobile responsiveness

---

## Chip Field Editing

Edit reference or enum fields inline by clicking chips in the table.

### Basic Chip Editing

```vue
<template>
  <CrudTable entity="task" :chip-fields-map="chipFieldsMap" ... />
</template>

<script setup lang="ts">
const chipFieldsMap = {
  status: [{ name: "status", required: true }, { name: "notes" }],
  assignee: [
    { name: "assignee", required: true },
    { name: "notify_assignee", default: true },
  ],
};
</script>
```

### How It Works

1. User clicks on a chip (status, assignee, etc.)
2. Opens inline edit dialog with specified fields
3. On submit: Updates only those fields
4. Table refreshes automatically

### Use Cases

- Quick status changes
- Reassign tasks
- Update categories/tags
- Change priority levels

---

## Styling & Theming

### Custom Column Widths

```typescript
const headers: TableHeader[] = [
  { title: "ID", key: "id", width: "80px" },
  { title: "Description", key: "desc" }, // Flexible width
  { title: "Actions", key: "_action", width: "150px" },
];
```

### Action Column Width

```vue
<DataTable entity="report" :headers="headers" action-width="200px" ... />
```

### Hide Toolbar

```vue
<DataTable entity="dashboard-stats" :headers="headers" hide-toolbar ... />
```

### Custom Entity Labels

```vue
<CrudTable entity="user" entity-label="System Users" create-label="Add New User" update-label="Edit User" delete-label="Remove User" clone-label="Duplicate User" ... />
```

### Custom Icons

```vue
<CrudTable entity="document" create-icon="mdi-file-plus" update-icon="mdi-pencil" delete-icon="mdi-trash-can" clone-icon="mdi-file-multiple" refresh-icon="mdi-reload" ... />
```
