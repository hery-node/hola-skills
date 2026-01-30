# Props Reference

Complete prop documentation for CrudTable and DataTable components.

## Table of Contents

- [CrudTable Props](#crudtable-props)
- [DataTable Props](#datatable-props)
- [Shared Type Definitions](#shared-type-definitions)

---

## CrudTable Props

Full-featured CRUD table with automatic metadata fetching and operation handling.

```typescript
interface CrudTableProps {
  // ========== Required ==========
  entity: string; // Entity name (e.g., "user", "product")
  sortDesc: boolean[]; // Sort directions [true=desc, false=asc]
  sortKey: string[]; // Sort field names
  itemLabelKey: string; // Field to use in delete confirmations

  // ========== Common ==========
  mode?: string; // Override server mode (e.g., "crsud")
  headers?: TableHeader[]; // Custom header definitions
  searchFields?: string[]; // Fields shown in search form
  editFields?: FormField[]; // Fields shown in create/edit form
  actions?: ItemAction[]; // Custom row actions
  toolbars?: ToolbarAction[]; // Custom toolbar buttons
  batchToolbars?: ToolbarAction[]; // Batch mode toolbar buttons

  // ========== Views ==========
  createView?: string; // Form view for create (default: "*")
  updateView?: string; // Form view for update (default: "*")
  chipView?: string; // Form view for chip edit (default: "*")
  createRoute?: string; // Redirect to route instead of dialog

  // ========== Behavior ==========
  mergeWithServer?: boolean; // true: use server fields, server overrides custom (default: true)
  // false: use custom fields only, custom overrides server
  onlyBatchDelete?: boolean; // Hide single delete, only batch (default: false)
  myActionFirst?: boolean; // Put custom actions before default (default: false)

  // ========== Display ==========
  expandFields?: string[]; // Fields shown in expanded row
  hideColumns?: string[]; // Columns to hide from table
  filter?: Record<string, unknown>; // Permanent filter conditions merged with search
  chipFieldsMap?: Record<string, FormField[]>; // Chip inline edit configuration

  // ========== Labels ==========
  entityLabel?: string; // Override entity display name
  createLabel?: string; // Override create button label
  updateLabel?: string; // Override update button label
  deleteLabel?: string; // Override delete button label
  cloneLabel?: string; // Override clone button label

  // ========== Icons ==========
  createIcon?: string; // Default: "mdi-plus-circle"
  updateIcon?: string; // Default: "mdi-square-edit-outline"
  cloneIcon?: string; // Default: "mdi-content-copy"
  deleteIcon?: string; // Default: "mdi-delete-circle"
  refreshIcon?: string; // Default: "mdi-refresh"
}
```

### Required Props

- **entity**: Entity name matching server router (e.g., "user", "product", "order")
- **sortDesc**: Array of boolean flags for sort direction (`true` = descending, `false` = ascending)
- **sortKey**: Array of field names to sort by (supports multi-column sorting)
- **itemLabelKey**: Field name used in delete confirmation dialogs (e.g., "email", "order_number")

### mergeWithServer Behavior

**`true` (CrudTable default):**

- Loops through **server fields**
- Server field properties (type, required, etc.) **override** custom properties
- Custom fields without matching server fields are ignored
- **Use when**: You want all server-defined fields with occasional custom overrides

**`false`:**

- Loops through **custom fields** only
- Custom properties **override** server properties
- Only shows fields you explicitly define
- **Use when**: You want full control over displayed fields

---

## DataTable Props

Lower-level table for custom list operations or read-only views.

```typescript
interface DataTableProps {
  // ========== Required ==========
  entity: string; // Entity name
  headers: TableHeader[]; // Column headers (must provide)

  // ========== Search ==========
  searchable?: boolean; // Show search form (default: false)
  searchFields?: string[]; // Fields in search form

  // ========== Pagination/Scroll ==========
  infinite?: boolean; // Infinite scroll (default: false, uses pagination)

  // ========== Actions ==========
  itemActions?: ItemAction[]; // Row action buttons
  showSelect?: boolean; // Show checkboxes (default: false)

  // ========== Display ==========
  expandFields?: string[]; // Expandable row fields
  hideColumns?: string[]; // Hide specific columns
  mergeWithServer?: boolean; // true: use server fields, server overrides custom (default: false)
  // false: use custom fields only, custom overrides server
  filter?: Record<string, unknown>; // Permanent filter conditions merged with search

  // ========== Refresh ==========
  refreshInterval?: number; // Auto-refresh milliseconds (default: 0 = disabled)

  // ========== Custom ==========
  listAction?: string; // Custom list endpoint (default: "/list")
  actionWidth?: string; // Action column width (default: auto)
  hideToolbar?: boolean; // Hide toolbar completely (default: false)
}
```

### Key Differences from CrudTable

1. **Headers required**: Unlike CrudTable, you must provide `headers` prop
2. **No CRUD operations**: DataTable is read-only by default
3. **mergeWithServer defaults to `false`**: Only shows custom fields
4. **No automatic meta fetching**: You control all display logic

---

## Shared Type Definitions

### TableHeader

```typescript
interface TableHeader {
  title: string; // Column header text
  key: string; // Field name
  sortable?: boolean; // Enable sorting (default: false)
  align?: "start" | "center" | "end"; // Text alignment
  width?: string; // Column width (e.g., "150px", "auto")
  expand?: (value: any) => string; // Custom HTML renderer for expandFields
}
```

### ItemAction

```typescript
interface ItemAction {
  icon: string; // Material Design Icon name (e.g., "mdi-check-circle")
  color?: string; // Vuetify color (e.g., "primary", "success", "error")
  tooltip?: string; // Tooltip text on hover
  handle: (item: any) => Promise<void> | void; // Click handler
  shown?: (item: any) => boolean; // Conditional visibility
  animate?: boolean; // Show loading spinner during execution
}
```

### ToolbarAction

```typescript
interface ToolbarAction {
  icon: string; // Material Design Icon name
  color?: string; // Vuetify color
  tooltip?: string; // Tooltip text
  click: () => Promise<void> | void; // Click handler
}
```

### FormField

```typescript
interface FormField {
  name: string; // Field name
  required?: boolean; // Mark as required
  default?: any; // Default value
  view?: string; // View name (e.g., "basic", "full", "*")
}
```

---

## Usage Examples

### Minimal CrudTable

```vue
<CrudTable entity="user" :sort-key="['created_at']" :sort-desc="[true]" item-label-key="email" />
```

### Fully Customized CrudTable

```vue
<CrudTable entity="product" :sort-key="['sku', 'name']" :sort-desc="[false, false]" item-label-key="name" mode="crsud" :headers="customHeaders" :search-fields="['name', 'category', 'status']" :edit-fields="editFields" :actions="rowActions" :toolbars="toolbarActions" :batch-toolbars="batchActions" :expand-fields="['description', 'specifications']" :filter="{ active: true }" :merge-with-server="false" />
```

### Basic DataTable

```vue
<DataTable entity="log" :headers="headers" searchable infinite :refresh-interval="5000" />
```

### DataTable with Custom Actions

```vue
<DataTable entity="report" :headers="headers" :item-actions="customActions" :filter="{ status: 'published' }" hide-toolbar />
```
