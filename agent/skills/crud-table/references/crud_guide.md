# Hola Web UI Components Skill

## Overview

The `hola-web/src/components` directory contains a comprehensive set of Vue.js components for building entity-driven web applications. These components are metadata-aware and integrate seamlessly with the Hola meta-programming framework to provide CRUD operations, data visualization, and advanced UI features.

## Component Registration

All components are registered globally and can be used with the `h-` prefix:

```javascript
import { setup_components } from '@/components';

// Call in main.js before creating Vue instance
setup_components();
```

## Metadata-Driven Architecture

The Hola Web UI components are **metadata-driven**, meaning most UI configuration is automatically fetched from the server and converted for client use by the `meta.js` mixin. This eliminates boilerplate and ensures consistency between server definitions and client UI.

### Metadata Conversion Process

The `meta.js` mixin (`hola-web/src/mixins/meta.js`) handles automatic conversion:

1. **Server Metadata Fetching** - Entity metadata is fetched via `get_entity_meta(entity)`
2. **Field Attribute Filtering** - Fields are filtered based on context (create, update, list, search)
3. **Type Resolution** - Field types are resolved via `get_type(field.type)` 
4. **UI Generation** - Input types, validation rules, labels, and formatting are applied
5. **i18n Integration** - Labels and hints are loaded from i18n files

**Key Conversion Functions:**

| Function | Purpose | Output |
|----------|---------|--------|
| `get_edit_fields(update_mode, view)` | Get form fields for create/update | Fields with input_type, rules, labels, items |
| `get_search_fields()` | Get search form fields | Fields with search_input_type |
| `get_table_headers(expand_fields)` | Get table column headers | Headers with format functions |
| `get_clone_fields()` | Get clone form fields | Cloneable fields only |

**Automatic Field Enrichment:**

Server field definition:
```javascript
{ 
  name: "category", 
  type: "product_category",  // Custom type
  required: true,
  create: true,
  list: true
}
```

After `meta.js` conversion:
```javascript
{
  name: "category",
  type: "product_category",
  label: "Product Category",           // From i18n: {entity}.category
  hint: "Select product category",     // From i18n: {entity}.category_hint
  input_type: "autocomplete",          // From type definition
  items: [{value: 0, text: "Electronics"}, ...],  // From type.items()
  rules: [v => !!v || "Category is required"],    // Auto-generated
  required: true
}
```

## Core Components

### 1. CrudTable (`h-crud`) - PRIMARY COMPONENT

**The recommended component for entity management.** It integrates `h-table`, `h-edit-form`, and `h-search-form` internally, providing complete CRUD operations with minimal configuration.

> **Note:** While `h-form` and `h-edit-form` exist as standalone components, they are primarily used internally by `h-crud`. For most use cases, you should use `h-crud` which handles all metadata conversion automatically.

**Props:**
- `entity` (String, required) - Entity name
- `sortDesc` (Array, required) - Sort descending flags (e.g., [true, false])
- `sortKey` (Array, required) - Sort field names (e.g., ["createdAt", "name"])
- `itemLabelKey` (String, required) - Field for delete confirmation display
- `mode` (String) - Operation modes (see below)
- `headers` (Array) - Custom table headers (optional, auto-generated from metadata)
- `editFields` (Array) - Custom form fields (optional, auto-generated from metadata)
- `searchFields` (Array) - Custom search fields (optional, auto-generated from metadata)
- `createView` / `updateView` (String) - Form view names (default: "*")
- `actions` (Array) - Additional item actions
- `toolbars` (Array) - Additional toolbar buttons

**Mode String:**
- `b` - Batch mode
- `c` - Create
- `d` - Delete
- `o` - Clone
- `p` - Pagination (vs infinite scroll)
- `r` - Refresh
- `s` - Search
- `u` - Update

**Keyboard Shortcuts:**
- `Alt+C` - Create new entity
- `Alt+R` - Refresh table
- `Alt+B` - Toggle batch mode
- `ESC` - Exit batch mode

**Metadata-Driven Example (Minimal Configuration):**
```vue
<template>
  <h-crud
    entity="product"
    :sort-desc="[true]"
    :sort-key="['createdAt']"
    item-label-key="name"
    mode="bcduprso">
  </h-crud>
</template>
```

This simple configuration automatically:
- Fetches metadata from server
- Generates table headers from fields with `list: true`
- Creates form fields from fields with `create/update: true`
- Creates search fields from fields with `search: true`
- Applies i18n labels, validation rules, and input types
- Handles all CRUD operations

**Custom Field Override Example:**
```vue
<h-crud
  entity="product"
  :sort-desc="[true]"
  :sort-key="['createdAt']"
  item-label-key="name"
  mode="bcduprso"
  :headers="customHeaders"
  :edit-fields="customEditFields">
</h-crud>

<script>
export default {
  data() {
    return {
      // Override specific headers while others come from metadata
      customHeaders: [
        { 
          name: "price", 
          format: (v) => `$${v.toFixed(2)}`,
          style: (v) => v > 100 ? 'font-weight-bold' : ''
        }
      ],
      // Override specific edit fields while others come from metadata
      customEditFields: [
        { 
          name: "discount",
          rule: [v => v <= 50 || "Discount cannot exceed 50%"]
        }
      ]
    };
  }
};
</script>
```

### 2. BasicForm (`h-form`) - INTERNAL USE

> **Internal Component:** Typically used inside `h-edit-form` and `h-crud`. Use `h-crud` for entity forms.

Low-level form component for manual field definitions (non-entity forms).

**When to use:** Only for standalone forms not related to entities (e.g., login, contact forms).

```vue
<h-form 
  :fields="manualFields" 
  v-model="formData"
  @submit="handleSubmit">
</h-form>
```

### 3. EditForm (`h-edit-form`) - INTERNAL USE

> **Internal Component:** Embedded in `h-crud`. Use `h-crud` for entity editing.

Entity-aware form that fetches metadata and handles create/update/clone operations.

**When to use:** Only when you need a standalone entity form without the table (rare).

### 4. DataTable (`h-table`) - ADVANCED USE

> **Note:** `h-table` is embedded in `h-crud`. Most users should use `h-crud` which provides table + forms. Use `h-table` standalone only when you need a read-only table or custom form integration.


Advanced data table with server-side pagination, sorting, search, and infinite scroll.

**Props:**
- `entity` (String, required) - Entity name
- `sortDesc` (Array, required) - Sort descending flags (e.g., [true, false])
- `sortKey` (Array, required) - Sort field names (e.g., ["createdAt", "name"])
- `headers` (Array) - Custom header definitions
- `filter` (Object) - Additional filter conditions
- `searchable` (Boolean) - Enable search form
- `searchFields` (Array) - Search form fields
- `infinite` (Boolean) - Infinite scroll mode
- `itemPerPage` (Number) - Items per page for infinite scroll
- `pagination` (Boolean) - Enable pagination (opposite of infinite)
- `hasActionHeader` (Boolean) - Show action column
- `itemActions` (Array) - Action button definitions
- `expandFields` (Array) - Fields to show in expanded row
- `hiddenFields` (Array) - Fields to fetch but not display
- `chipClickable` (Boolean) - Make chips clickable for ref fields
- `interval` (Number) - Auto-refresh interval in seconds (-1 to disable)
- `mobile` (Boolean) - Enable mobile-responsive mode

**Header Configuration:**
```javascript
{
  name: "field_name",         // Field name
  text: "Column Header",      // Header text
  value: "field_name",        // Value accessor
  sortable: true,             // Allow sorting
  align: "start",             // Alignment: start|center|end
  width: "120px",            // Column width
  chip: false,               // Render as chip
  style: (value) => "class",  // Dynamic style function
  format: (value) => "text",  // Format function
  click: (id, ref) => {}     // Click handler for chips
}
```

**Action Configuration:**
```javascript
{
  icon: "mdi-delete",         // Material icon
  color: "error",             // Icon color
  tooltip: "Delete",          // Tooltip text
  handle: (item) => {},       // Click handler
  animate: true,              // Show loading animation
  shown: (item) => true       // Visibility condition
}
```

**Methods:**
- `refresh()` - Reload table data
- `set_data(items)` - Set items directly
- `show_error(msg)` / `show_success(msg)` / `show_info(msg)` / `show_warning(msg)` - Show alerts

**Events:**
- `@loaded` - Emitted when data loaded
- `@chip` - Emitted when chip clicked

**Example:**
```vue
<h-table
  entity="order"
  :sort-desc="[true]"
  :sort-key="['createdAt']"
  :headers="orderHeaders"
  searchable
  :search-fields="searchFields"
  :item-actions="actions"
  @chip="handleChipClick">
</h-table>
```

### 5. ArrayTable (`h-array`)


Display array of objects in table format with search, export, and actions.

**Props:**
- `objs` (Array, required) - Array of objects to display
- `hiddenProperties` (Array) - Properties to hide
- `showToolbar` (Boolean) - Show search toolbar
- `searchHint` (String) - Search placeholder text
- `actions` (Array) - Row action buttons
- `downloadExcelName` (String) - Enable Excel export with filename
- `headerWidth` / `headerAlign` / `headerClass` - Header styling
- `headerUppcase` (Boolean) - Uppercase headers

**Example:**
```vue
<h-array
  :objs="resultArray"
  show-toolbar
  download-excel-name="report.xlsx"
  :actions="[{icon: 'mdi-eye', tooltip: 'View', handle: viewItem}]">
</h-array>
```

## Advanced View Components

### 6. EntityKanbanView (`h-kanban`)

Kanban board with drag-and-drop for status management.

**Props:**
- `entity` (String, required) - Entity name
- `items` (Array, required) - Entity items
- `statusField` (String) - Status field name (auto-detected from enum fields)
- `titleField` (String) - Field for card titles
- `displayFields` (Array) - Fields to display on cards
- `priorityField` (String) - Priority field for color coding
- `priorityColors` (Object) - Priority value to color mapping
- `showAggregations` (Boolean) - Show column aggregations
- `aggregationField` (String) - Numeric field for sum aggregation

**Events:**
- `@view` - Card clicked
- `@edit` - Edit button clicked
- `@create` - Add button clicked in column
- `@update-status` - Entity moved between columns

**Example:**
```vue
<h-kanban
  entity="task"
  :items="tasks"
  status-field="status"
  title-field="title"
  :display-fields="['assignee', 'dueDate']"
  priority-field="priority"
  :priority-colors="{1: 'green', 2: 'orange', 3: 'red'}"
  @update-status="handleStatusChange">
</h-kanban>
```

### 7. EntityCalendarView (`h-calendar`)

Calendar view for date-based entities.

**Props:**
- `entity` (String, required) - Entity name
- `items` (Array, required) - Entity items
- `dateField` (String) - Date field name
- `titleField` (String) - Title field name
- `colorField` (String) - Field for event colors

**Events:**
- `@event-click` - Event clicked
- `@date-click` - Empty date clicked

### 8. EntityTimelineView (`h-timeline`)

Timeline visualization for chronological data.

**Props:**
- `entity` (String, required) - Entity name
- `items` (Array, required) - Entity items
- `dateField` (String) - Date field name
- `titleField` (String) - Title field name
- `descriptionField` (String) - Description field name

### 9. EntityGalleryView (`h-gallery`)

Image gallery with lightbox for media entities.

**Props:**
- `entity` (String, required) - Entity name
- `items` (Array, required) - Entity items
- `imageField` (String) - Image URL field name
- `titleField` (String) - Title field name

### 10. EntityTreeView (`h-tree`)

Hierarchical tree view for nested data.

**Props:**
- `entity` (String, required) - Entity name
- `items` (Array, required) - Entity items
- `parentField` (String) - Parent reference field
- `labelField` (String) - Label field name

## Utility Components

### 11. SearchForm (`h-search-form`)

Entity search form with metadata integration.

**Props:**
- `entity` (String, required) - Entity name
- `fields` (Array) - Search field definitions
- `title` (String) - Form title
- `cols` (Number) - Grid columns per field

**Events:**
- `@search` - Search submitted
- `@clear` - Search cleared

### 12. ConfirmDialog (`h-confirm`)

Confirmation dialog component.

**Methods:**
- `open(title, message)` - Show dialog, returns Promise<boolean>

**Example:**
```vue
<h-confirm ref="confirm" />

// In methods:
const confirmed = await this.$refs.confirm.open('Delete Item', 'Are you sure?');
if (confirmed) {
  // Perform delete
}
```

### 13. BasicWindow (`h-window`)

Modal window component.

**Props:**
- `title` (String) - Window title
- `width` (String) - Window width (default: "500px")

**Methods:**
- `show()` - Open window
- `close()` - Close window

**Events:**
- `@close` - Window closed

### 14. PropertyTable (`h-property`)

Display object properties in labeled rows.

**Props:**
- `obj` (Object, required) - Object to display
- `properties` (Array) - Properties to show

### 15. FileUploadField (`h-file`)

File upload with GridFS integration.

**Props:**
- `entity` (String, required) - Entity name
- `fieldName` (String, required) - Field name
- `accept` (String) - Accepted file types
- `multiple` (Boolean) - Allow multiple files

**Events:**
- `@uploaded` - Files uploaded successfully

### 16. RelationshipPicker (`h-relationship`)

Reference entity picker with search.

**Props:**
- `entity` (String, required) - Target entity name
- `value` (String|Array) - Selected ID(s)
- `multiple` (Boolean) - Allow multiple selection
- `searchFields` (Array) - Fields to search

**Events:**
- `@input` - Selection changed

## Chart Components

### 17. ChartLineView (`h-line-chart`)

Line chart visualization.

**Props:**
- `data` (Object, required) - Chart data
- `labels` (Array) - X-axis labels
- `title` (String) - Chart title

### 18. ChartBarView (`h-bar-chart`)

Bar chart visualization.

### 19. ChartPieView (`h-pie-chart`)

Pie chart visualization.

### 20. ChartComboView (`h-combo-chart`)

Combined line and bar chart.

### 21. ChartDashboardView (`h-dash-chart`)

Dashboard with multiple charts.

## Navigation Components

### 22. NavBar (`h-nav-bar`)

Application navigation bar.

**Props:**
- `items` (Array) - Navigation items
- `logo` (String) - Logo URL
- `title` (String) - App title

### 23. MobileMenu (`h-mobile-menu`)

Mobile-responsive menu.

## Best Practices

### 1. Use Metadata-Aware Components

Prefer components that integrate with entity metadata (`h-table`, `h-crud`, `h-edit-form`) over basic components for entity operations.

### 2. Component Naming Convention

All components use the `h-` prefix to indicate they are part of the Hola framework.

### 3. Event Handling

Components emit events for user actions. Always handle critical events like `@success` and `@cancel`:

```vue
<h-edit-form
  entity="product"
  @success="handleSuccess"
  @cancel="handleCancel">
</h-edit-form>
```

### 4. Form Validation

Use validation rules in field definitions for client-side validation:

```javascript
{
  name: "email",
  type: "email",
  rules: [
    v => !!v || "Email is required",
    v => /.+@.+\..+/.test(v) || "Email must be valid"
  ]
}
```

### 5. Responsive Design

Use the `cols` property on fields to control grid layout:

```javascript
// Full width on mobile, half width on desktop
{ name: "firstName", cols: 12, md: 6 }
```

### 6. Performance Optimization

- Use `infinite` mode for large datasets instead of pagination
- Set appropriate `interval` for auto-refresh (or -1 to disable)
- Use `hiddenFields` to fetch only necessary data

### 7. Accessibility

- Always provide `label` for form fields
- Use `hint` for additional guidance
- Provide tooltips for action buttons

## Common Patterns

### CRUD Operations

```vue
<template>
  <h-crud
    entity="product"
    :sort-desc="[true]"
    :sort-key="['createdAt']"
    item-label-key="name"
    mode="bcduprso"
    :headers="headers"
    :edit-fields="editFields"
    :search-fields="searchFields">
  </h-crud>
</template>

<script>
export default {
  data() {
    return {
      headers: [
        { name: "name", text: "Product Name" },
        { name: "price", text: "Price", format: (v) => `$${v}` },
        { name: "category", text: "Category", chip: true }
      ],
      editFields: [
        { name: "name", type: "string", required: true },
        { name: "price", type: "currency", required: true },
        { name: "category", type: "product_category" }
      ],
      searchFields: [
        { name: "name", type: "string" },
        { name: "category", type: "product_category" }
      ]
    };
  }
};
</script>
```

### Custom Actions

```javascript
const customActions = [
  {
    icon: "mdi-eye",
    color: "primary",
    tooltip: "View Details",
    handle: (item) => {
      this.$router.push(`/product/${item._id}`);
    }
  },
  {
    icon: "mdi-download",
    color: "success",
    tooltip: "Export",
    animate: true,
    handle: async (item) => {
      await this.exportProduct(item);
    }
  }
];
```

### Inline Editing

```vue
<h-table
  entity="task"
  :headers="headers"
  chip-clickable
  :chip-fields-map="chipFields"
  @chip="handleChipClick">
</h-table>
```

## Summary

The Hola Web UI component library provides:
- **Metadata-driven components** - Automatic form generation and validation
- **CRUD operations** - Complete create, read, update, delete workflows
- **Advanced visualizations** - Kanban, calendar, timeline, tree, gallery views
- **Responsive design** - Mobile-first, adaptive layouts
- **Internationalization** - Full i18n support via Vue I18n
- **Extensibility** - Custom actions, toolbars, and field types

These components integrate seamlessly with the Hola meta-programming framework to build robust, maintainable web applications with minimal boilerplate code.
