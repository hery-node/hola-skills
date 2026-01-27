# UI Components Reference

Complete reference for Hola Web UI components (Vue 3 + Vuetify 3).

## Component Registration

```javascript
// main.ts
import { setup_components } from "@/components";

const app = createApp(App);
setup_components(app); // Register all h-* components globally
```

## Quick Decision Tree

```
What do you need?
├─ Full CRUD with table + forms → h-crud (90% of use cases)
├─ Read-only table with custom form → h-table
├─ Standalone entity form → h-edit-form
├─ Non-entity form → h-form
├─ Array/object display → h-array
├─ Kanban board → h-kanban
├─ Calendar view → h-calendar
└─ Custom visualization → Build custom Vue component
```

## h-crud - Primary Component

**Use for**: 95% of entity management scenarios

### Props

| Prop           | Type   | Required | Default | Description                                    |
| -------------- | ------ | -------- | ------- | ---------------------------------------------- |
| `entity`       | String | ✓        | -       | Entity name (matches server collection)        |
| `mode`         | String | ✓        | -       | Operation modes (see below)                    |
| `sortKey`      | Array  | ✓        | -       | Field names for sorting                        |
| `sortDesc`     | Array  | ✓        | -       | Sort directions (true = descending)            |
| `itemLabelKey` | String | ✓        | -       | Field to show in delete confirmation           |
| `headers`      | Array  |          | auto    | Custom table headers                           |
| `editFields`   | Array  |          | auto    | Custom form fields                             |
| `searchFields` | Array  |          | auto    | Custom search fields                           |
| `createView`   | String |          | "\*"    | View name for create form                      |
| `updateView`   | String |          | "\*"    | View name for update form                      |
| `actions`      | Array  |          | []      | Additional row actions                         |
| `toolbars`     | Array  |          | []      | Additional toolbar buttons                     |
| `filter`       | Object |          | {}      | Additional filter conditions                   |
| `interval`     | Number |          | -1      | Auto-refresh interval (seconds, -1 = disabled) |

### Mode String

Combine characters to enable features:

| Char | Feature    | Description                         |
| ---- | ---------- | ----------------------------------- |
| `c`  | Create     | Show create button + form           |
| `r`  | Refresh    | Show refresh button                 |
| `u`  | Update     | Show edit button + form             |
| `d`  | Delete     | Show delete button                  |
| `s`  | Search     | Show search form                    |
| `o`  | Clone      | Show clone button                   |
| `b`  | Batch      | Enable batch operations             |
| `p`  | Pagination | Use pagination (vs infinite scroll) |

**Common combinations**:

- `"crudsp"` - Full CRUD with search and pagination
- `"crud"` - Basic CRUD without search
- `"rs"` - Read-only with search
- `"crudsob"` - Full featured with clone and batch
- `"crudo"` - CRUD with clone

### Keyboard Shortcuts

- `Alt+C` - Create new entity
- `Alt+R` - Refresh table
- `Alt+B` - Toggle batch mode
- `ESC` - Exit batch mode

### Basic Example

```vue
<template>
  <h-crud entity="product" mode="crudsp" :sortKey="['name']" :sortDesc="[false]" itemLabelKey="name" />
</template>
```

### Custom Headers Example

```vue
<template>
  <h-crud entity="product" mode="crudsp" :sortKey="['name']" :sortDesc="[false]" itemLabelKey="name" :headers="customHeaders" />
</template>

<script setup>
const customHeaders = [
  { text: "SKU", value: "sku", sortable: true },
  { text: "Name", value: "name", sortable: true },
  {
    text: "Price",
    value: "price",
    sortable: true,
    format: (v) => `$${v.toFixed(2)}`,
    align: "end",
  },
  { text: "Stock", value: "stock", sortable: true },
  { text: "Actions", value: "actions", sortable: false },
];
</script>
```

### Custom Actions Example

```vue
<template>
  <h-crud entity="product" mode="crudsp" :sortKey="['name']" :sortDesc="[false]" itemLabelKey="name" :actions="customActions" :toolbars="customToolbars" />
</template>

<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

const customActions = [
  {
    icon: "mdi-chart-line",
    label: "Analytics",
    click: (item) => {
      router.push(`/products/${item._id}/analytics`);
    },
  },
  {
    icon: "mdi-eye",
    label: "Preview",
    click: (item) => {
      window.open(`/preview/${item._id}`, "_blank");
    },
  },
];

const customToolbars = [
  {
    icon: "mdi-file-export",
    label: "Export CSV",
    click: () => {
      window.location.href = "/api/product/export?format=csv";
    },
  },
];
</script>
```

## h-table - Advanced Table

**Use for**: Read-only tables or when you need custom form integration

### Props

| Prop              | Type    | Required | Default | Description               |
| ----------------- | ------- | -------- | ------- | ------------------------- |
| `entity`          | String  | ✓        | -       | Entity name               |
| `sortKey`         | Array   | ✓        | -       | Sort field names          |
| `sortDesc`        | Array   | ✓        | -       | Sort directions           |
| `headers`         | Array   |          | auto    | Header definitions        |
| `filter`          | Object  |          | {}      | Filter conditions         |
| `searchable`      | Boolean |          | false   | Enable search form        |
| `searchFields`    | Array   |          | auto    | Search fields             |
| `infinite`        | Boolean |          | false   | Infinite scroll mode      |
| `itemPerPage`     | Number  |          | 20      | Items per page (infinite) |
| `pagination`      | Boolean |          | true    | Enable pagination         |
| `hasActionHeader` | Boolean |          | true    | Show action column        |
| `itemActions`     | Array   |          | []      | Action buttons            |
| `expandFields`    | Array   |          | []      | Fields in expanded row    |
| `hiddenFields`    | Array   |          | []      | Fields to fetch but hide  |
| `chipClickable`   | Boolean |          | true    | Make ref chips clickable  |
| `interval`        | Number  |          | -1      | Auto-refresh (seconds)    |
| `mobile`          | Boolean |          | false   | Mobile responsive mode    |

### Header Configuration

```javascript
{
  name: "field_name",           // Field name
  text: "Column Header",        // Display text
  value: "field_name",          // Value accessor
  sortable: true,               // Allow sorting
  align: "start",               // start|center|end
  width: "120px",              // Column width
  chip: false,                 // Render as chip
  style: (value) => "class",    // Dynamic CSS class
  format: (value) => "text",    // Format function
  click: (id, ref) => {}       // Chip click handler
}
```

### Methods

```vue
<template>
  <h-table ref="tableRef" entity="product" ... />
</template>

<script setup>
import { ref } from "vue";

const tableRef = ref(null);

// Refresh table data
const refresh = () => {
  tableRef.value.refresh();
};

// Set data directly
const setData = (items) => {
  tableRef.value.set_data(items);
};

// Show alerts
const showSuccess = () => {
  tableRef.value.show_success("Operation successful");
};
</script>
```

### Events

- `@loaded` - Emitted when data loaded
- `@chip` - Emitted when ref chip clicked

## h-edit-form - Standalone Form

**Use for**: Standalone entity forms without table

### Props

| Prop     | Type   | Required | Default  | Description                    |
| -------- | ------ | -------- | -------- | ------------------------------ |
| `entity` | String | ✓        | -        | Entity name                    |
| `mode`   | String |          | "create" | "create", "update", or "clone" |
| `itemId` | String |          | null     | Item ID (for update/clone)     |
| `fields` | Array  |          | auto     | Custom field definitions       |
| `view`   | String |          | "\*"     | View name                      |

### Example

```vue
<template>
  <h-edit-form entity="product" mode="create" :fields="customFields" @submit="handleSubmit" @cancel="handleCancel" />
</template>

<script setup>
const customFields = [
  { name: "name", label: "Product Name", input_type: "text", required: true },
  { name: "price", label: "Price", input_type: "number", required: true },
];

const handleSubmit = (data) => {
  console.log("Form submitted:", data);
};

const handleCancel = () => {
  console.log("Form cancelled");
};
</script>
```

## h-form - Basic Form

**Use for**: Non-entity forms (login, contact, etc.)

### Props

| Prop         | Type   | Required | Default | Description         |
| ------------ | ------ | -------- | ------- | ------------------- |
| `fields`     | Array  | ✓        | -       | Field definitions   |
| `modelValue` | Object |          | {}      | Form data (v-model) |

### Field Definition

```javascript
{
  name: "email",
  label: "Email Address",
  input_type: "email",      // text, number, email, password, textarea, select, etc.
  required: true,
  hint: "Enter your email",
  rules: [v => !!v || "Email is required"],
  items: [],               // For select/autocomplete
  rows: 5                  // For textarea
}
```

### Example

```vue
<template>
  <h-form :fields="loginFields" v-model="formData" @submit="handleLogin" />
</template>

<script setup>
import { ref } from "vue";

const formData = ref({ email: "", password: "" });

const loginFields = [
  {
    name: "email",
    label: "Email",
    input_type: "email",
    required: true,
  },
  {
    name: "password",
    label: "Password",
    input_type: "password",
    required: true,
  },
];

const handleLogin = () => {
  console.log("Login:", formData.value);
};
</script>
```

## h-array - Array Display

**Use for**: Displaying arrays/objects in table format

### Props

| Prop                | Type    | Required | Default  | Description         |
| ------------------- | ------- | -------- | -------- | ------------------- |
| `objs`              | Array   | ✓        | -        | Array of objects    |
| `hiddenProperties`  | Array   |          | []       | Properties to hide  |
| `showToolbar`       | Boolean |          | false    | Show search toolbar |
| `searchHint`        | String  |          | "Search" | Search placeholder  |
| `actions`           | Array   |          | []       | Row actions         |
| `downloadExcelName` | String  |          | null     | Enable Excel export |
| `headerWidth`       | String  |          | "120px"  | Header column width |
| `headerAlign`       | String  |          | "start"  | Header alignment    |
| `headerClass`       | String  |          | ""       | Header CSS class    |
| `headerUppercase`   | Boolean |          | true     | Uppercase headers   |

### Example

```vue
<template>
  <h-array :objs="reportData" showToolbar downloadExcelName="report.xlsx" :actions="arrayActions" :hiddenProperties="['_id', 'internal']" />
</template>

<script setup>
const reportData = ref([
  { name: "Product A", sales: 100, revenue: 1000 },
  { name: "Product B", sales: 200, revenue: 2000 },
]);

const arrayActions = [
  {
    icon: "mdi-eye",
    tooltip: "View Details",
    handle: (item) => console.log(item),
  },
];
</script>
```

## h-kanban - Kanban Board

**Use for**: Status-based workflows with drag-and-drop

### Props

| Prop            | Type   | Required | Default | Description             |
| --------------- | ------ | -------- | ------- | ----------------------- |
| `entity`        | String | ✓        | -       | Entity name             |
| `items`         | Array  | ✓        | -       | Entity items            |
| `statusField`   | String |          | auto    | Status field name       |
| `titleField`    | String |          | auto    | Card title field        |
| `displayFields` | Array  |          | []      | Fields to show on cards |

### Example

```vue
<template>
  <h-kanban entity="task" :items="tasks" statusField="status" titleField="title" :displayFields="['assignee', 'dueDate']" @update="handleStatusChange" />
</template>

<script setup>
import { ref, onMounted } from "vue";
import { api } from "@/core/api";

const tasks = ref([]);

onMounted(async () => {
  const response = await api.get("/task");
  tasks.value = response.data;
});

const handleStatusChange = async ({ item, newStatus }) => {
  await api.put(`/task/${item._id}`, { status: newStatus });
  // Refresh tasks
};
</script>
```

## h-calendar - Calendar View

**Use for**: Date-based events and scheduling

### Props

| Prop         | Type   | Required | Default     | Description       |
| ------------ | ------ | -------- | ----------- | ----------------- |
| `entity`     | String | ✓        | -           | Entity name       |
| `items`      | Array  | ✓        | -           | Event items       |
| `startField` | String |          | "startDate" | Start date field  |
| `endField`   | String |          | "endDate"   | End date field    |
| `titleField` | String |          | "title"     | Event title field |

### Example

```vue
<template>
  <h-calendar entity="event" :items="events" startField="startDate" endField="endDate" titleField="title" @click-event="handleEventClick" />
</template>

<script setup>
import { ref, onMounted } from "vue";
import { api } from "@/core/api";

const events = ref([]);

onMounted(async () => {
  const response = await api.get("/event");
  events.value = response.data;
});

const handleEventClick = (event) => {
  console.log("Event clicked:", event);
};
</script>
```

## API Integration

### Using Built-in API Helper

```typescript
import { api } from "@/core/api";

// GET request
const products = await api.get("/product");
const product = await api.get(`/product/${id}`);

// POST request
const newProduct = await api.post("/product", {
  sku: "ABC123",
  name: "Product",
});

// PUT request
const updated = await api.put(`/product/${id}`, { price: 99 });

// DELETE request
await api.delete(`/product/${id}`);

// With query params
const filtered = await api.get("/product", {
  params: { category: "electronics" },
});
```

## Metadata-Driven Development

Components automatically fetch and use server metadata:

```javascript
// Server metadata
{
  collection: "product",
  fields: [
    { name: "sku", type: "string", required: true, list: true, search: true },
    { name: "name", type: "string", required: true, list: true },
    { name: "price", type: "number", required: true, list: true }
  ]
}

// Client component (auto-generates everything)
<h-crud entity="product" mode="crudsp" :sortKey="['name']" :sortDesc="[false]" itemLabelKey="name" />

// Automatically creates:
// - Table with columns: sku, name, price
// - Create form with fields: sku, name, price (all required)
// - Search form with fields: sku
// - Proper validation rules
// - i18n labels
```

## Input Types

Automatically determined by field type:

| Field Type                 | Input Type     | Component                          |
| -------------------------- | -------------- | ---------------------------------- |
| `string`                   | text           | v-text-field                       |
| `number`, `int`            | number         | v-text-field type="number"         |
| `email`                    | email          | v-text-field type="email"          |
| `password`                 | password       | v-text-field type="password"       |
| `date`                     | date           | v-text-field type="date"           |
| `datetime`                 | datetime-local | v-text-field type="datetime-local" |
| `boolean`                  | checkbox       | v-checkbox                         |
| `text`                     | textarea       | v-textarea                         |
| `array`                    | chips          | v-combobox chips                   |
| `ref` (string)             | autocomplete   | v-autocomplete                     |
| `ref` (array)              | autocomplete   | v-autocomplete multiple            |
| Custom type with `items()` | select         | v-select                           |

## Styling & Theming

Components use Vuetify 3 theming:

```typescript
// main.ts
const vuetify = createVuetify({
  theme: {
    defaultTheme: "light",
    themes: {
      light: {
        colors: {
          primary: "#1976D2",
          secondary: "#424242",
          accent: "#82B1FF",
          error: "#FF5252",
          success: "#4CAF50",
        },
      },
    },
  },
});
```

## Best Practices

1. **Use h-crud by default** - Covers 90%+ of use cases
2. **Let metadata drive UI** - Don't override unless necessary
3. **Custom headers for formatting** - Use `format` and `style` functions
4. **Custom actions for workflows** - Add domain-specific actions
5. **Multi-view for complex forms** - Use `view` attribute on server
6. **Composables for data fetching** - Reusable data access patterns
7. **Vue Router for navigation** - Standard Vue routing
8. **API interceptors for auth** - Handle 401s globally
9. **i18n for labels** - Internationalization from the start
10. **Mobile responsive** - Use Vuetify's responsive utilities

## Component Decision Matrix

| Scenario                     | Component   | Configuration        |
| ---------------------------- | ----------- | -------------------- |
| Full entity management       | h-crud      | mode="crudsp"        |
| Read-only list               | h-crud      | mode="rs"            |
| Create only                  | h-crud      | mode="c"             |
| Custom table + separate form | h-table     | Build custom form    |
| Standalone entity form       | h-edit-form | mode="create/update" |
| Login/contact form           | h-form      | Manual field defs    |
| Display report data          | h-array     | With export option   |
| Task board                   | h-kanban    | Status workflow      |
| Event scheduling             | h-calendar  | Date fields          |
| Custom visualization         | Custom Vue  | Build from scratch   |

---

For workflow guidance, see [workflow documentation](../workflow/). For common patterns, see [patterns.md](patterns.md).
