# Advanced Topics

Deep dive into metadata, CRUD operations, i18n, error handling, and performance optimization.

## Table of Contents

- [Meta Fetching](#meta-fetching)
- [CRUD Operations](#crud-operations)
- [Filter Prop](#filter-prop)
- [i18n Integration](#i18n-integration)
- [Error Handling](#error-handling)
- [Performance Tips](#performance-tips)
- [mergeWithServer](#mergewithserver)

---

## Meta Fetching

### Automatic Meta Fetching

Both CrudTable and DataTable automatically fetch metadata from server on mount:

```typescript
// Component calls:
GET /{entity}/meta

// Server response:
{
  "code": 0,
  "data": {
    "mode": "crsud",
    "fields": [
      { "name": "email", "type": "email", "required": true },
      { "name": "name", "type": "string" },
      { "name": "status", "type": "user_status", "default": 0 }
    ]
  }
}
```

### Using useMeta Composable

Access metadata programmatically for custom logic:

```vue
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useMeta } from "@/composables";

const entity = ref("user");
const { meta, loadMeta, getSearchFields, getEditFields, getTableHeaders } = useMeta({
  entity,
});

onMounted(async () => {
  await loadMeta();
  console.log("Mode:", meta.value?.mode);
  console.log("Fields:", meta.value?.fields);

  // Get formatted fields for forms
  const searchFields = await getSearchFields();
  const editFields = await getEditFields(false, "*");
  const headers = await getTableHeaders();
});
</script>
```

### Field Type Integration

Meta fields automatically integrate with registered types:

```typescript
// Server type definition
register_type(int_enum_type("user_status", [0, 1, 2]));

// Client type definition
register_type({
  name: "user_status",
  input_type: "autocomplete",
  items: (vue) => [
    { value: 0, text: vue.$t("user_status.pending") },
    { value: 1, text: vue.$t("user_status.active") },
    { value: 2, text: vue.$t("user_status.inactive") },
  ],
  format: (value, vue) => {
    const labels = ["pending", "active", "inactive"];
    return vue.$t(`user_status.${labels[value]}`);
  },
});
```

CrudTable/DataTable automatically:

- Use `autocomplete` input in forms
- Display formatted labels in table
- Populate dropdown items

### Reference Field Resolution

Fields with `ref` attribute automatically fetch reference labels:

```typescript
// Server meta field
{ name: "owner", ref: "user", type: "string" }

// Client automatically calls:
GET /user/ref?ref_by_entity=task&query=

// Response:
{
  "code": 0,
  "data": [
    { "title": "John Doe", "value": "507f1f77bcf86cd799439011" },
    { "title": "Jane Smith", "value": "507f191e810c19729de860ea" }
  ]
}
```

Forms show autocomplete with user names, table displays resolved labels.

---

## CRUD Operations

### How CrudTable Handles Operations

#### Create

1. User clicks Create button (or Alt+C)
2. Opens `EditForm` with `createView` fields
3. On submit: `POST /{entity}` with form data
4. On success: Refreshes table, shows success message

#### Update

1. User clicks Edit action on row
2. Opens `EditForm` with current data, `updateView` fields
3. On submit: `PUT /{entity}/:id` with changes
4. On success: Refreshes table

#### Clone

1. User clicks Clone action on row
2. Opens `EditForm` with source data, `cloneView` fields
3. On submit: `POST /{entity}/:id/clone` with overrides
4. On success: Refreshes table

#### Delete

1. User clicks Delete action on row
2. Shows confirmation dialog with `itemLabelKey` value
3. On confirm: `DELETE /{entity}/:id`
4. On success: Refreshes table

#### Batch Delete

1. User enables batch mode (Alt+B or button)
2. Selects multiple rows via checkboxes
3. Clicks batch delete toolbar button
4. Confirms deletion
5. Deletes each selected ID sequentially

### Manual CRUD Operations

Use axios functions directly for custom workflows:

```vue
<script setup lang="ts">
import { saveEntity, deleteEntity, readEntity } from "@/core/axios";
import { isSuccessResponse } from "@/core/utils";

// Create
const createUser = async (data) => {
  const result = await saveEntity("user", data, false);
  if (isSuccessResponse(result.code)) {
    console.log("Created successfully");
  }
};

// Update
const updateUser = async (id, data) => {
  const result = await saveEntity("user", { ...data, _id: id }, true);
};

// Clone
const cloneUser = async (id, overrides) => {
  const result = await saveEntity("user", { ...overrides, _id: id }, true, true);
};

// Delete single
const deleteUser = async (id) => {
  const result = await deleteEntity("user", [id]);
};

// Delete multiple
const deleteUsers = async (ids) => {
  const result = await deleteEntity("user", ids);
};

// Read
const user = await readEntity("user", id, "*");
</script>
```

---

## Filter Prop

The `filter` prop applies permanent server-side filters merged with search form values on every request.

### How filter Works

```typescript
// Internal implementation
const queryObj = props.filter
  ? { ...searchForm.value, ...props.filter }
  : searchForm.value;

// Sends to server as:
POST /entity/list
{
  "filter": {
    "name": "search term",      // From search form
    "project": "project_id",    // From filter prop
    "status": "active"          // From filter prop
  },
  "sort": { "created_at": -1 },
  "skip": 0,
  "limit": 30
}
```

### Filter Best Practices

- **Use computed properties** for reactive filters based on route, user context, or state
- **Provide empty object `{}`** as fallback when filter conditions are not met
- **Combine with `hideColumns`** to hide filtered fields from display
- **Use for permanent constraints**: permissions, project scope, soft-delete, tenant isolation
- **Use search form for user-initiated filtering**: user controls these values
- **Filter prop values override** search form values for same fields

### Use Cases

**Project-Scoped Data:**

```vue
const filter = computed(() => currentProject.value ? { project: currentProject.value._id } : {} );
```

**Permission-Based Filtering:**

```vue
const filter = computed(() => ({ tenant_id: currentUser.value.tenant_id, visible_to: { $in: [currentUser.value.role, 'all'] } }));
```

**Soft-Delete Protection:**

```vue
const filter = { deleted: { $ne: true } };
```

---

## i18n Integration

### Entity Labels

Define translations for entity and field labels:

```json
// locales/en.json
{
  "user": {
    "_label": "User",
    "email": "Email Address",
    "name": "Full Name",
    "phone": "Phone Number",
    "status": "Status"
  },
  "user_status": {
    "pending": "Pending Activation",
    "active": "Active",
    "inactive": "Inactive"
  }
}
```

### Override Labels

Override default labels with props:

```vue
<CrudTable entity="user" entity-label="System User" create-label="Add New User" update-label="Edit User" delete-label="Remove User" clone-label="Duplicate User" :sort-key="['email']" :sort-desc="[false]" item-label-key="email" />
```

### Using i18n in Custom Rendering

```vue
<script setup lang="ts">
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const headers = [
  {
    name: "status",
    expand: (value: number) => {
      const statusKey = `user_status.${["pending", "active", "inactive"][value]}`;
      return `<td>${t(statusKey)}</td>`;
    },
  },
];
</script>
```

---

## Error Handling

### Automatic Error Display

Both components show error alerts automatically at the top of the table:

```vue
<CrudTable entity="user" ... />
<!-- Errors appear as alerts above table -->
```

### Standard Error Codes

Errors are automatically formatted based on response code:

| Code  | Meaning            | Display                          |
| ----- | ------------------ | -------------------------------- |
| `400` | Missing parameters | "Missing required parameters"    |
| `403` | Permission denied  | "Access denied"                  |
| `404` | Not found          | "Resource not found"             |
| `422` | Validation failed  | "Validation error: [details]"    |
| `423` | Has references     | "Cannot delete - has references" |
| `500` | Server error       | "Internal server error"          |

### Custom Error Handling

Register custom error handlers during axios initialization:

```typescript
import { initAxios } from "@/core/axios";
import router from "@/router";

initAxios(
  { baseURL: "http://localhost:3000" },
  {
    handleResponse: (code, data) => {
      if (code === 401) {
        // Unauthorized - redirect to login
        router.push("/login");
      } else if (code === 403) {
        // Forbidden - show custom dialog
        showCustomErrorDialog("Access Denied", data.message);
      } else if (code === 500) {
        // Server error - log to monitoring service
        logErrorToService({ code, data, timestamp: new Date() });
      }
    },
  },
);
```

### Error Context

Error messages include context when available:

```typescript
// Delete with references error
{
  code: 423,
  message: "Cannot delete user - has 5 associated tasks"
}

// Validation error
{
  code: 422,
  message: "Validation failed",
  errors: {
    email: "Invalid email format",
    phone: "Phone number required"
  }
}
```

---

## Performance Tips

### 1. ✅ Use Infinite Scroll (Default Recommended)

```vue
<!-- ✅ Best - infinite scroll for better UX -->
<DataTable entity="logs" :headers="headers" infinite />

<!-- ⚠️ Only if pagination specifically required -->
<CrudTable entity="reports" mode="crsudp" ... />
```

**Infinite scroll benefits:**

- Better mobile experience
- Faster perceived performance
- Natural scrolling behavior
- No page load delays
- Seamless data loading

**Use pagination only when:**

- Users need to jump to specific pages
- Print-friendly layouts required
- Regulatory compliance needs page numbers
- Legacy system requirements

### 2. Limit expandFields

Only expand fields that are actually needed:

```vue
<!-- ❌ Bad - expands all fields -->
<CrudTable entity="order" :expand-fields="['*']" ... />

<!-- ✅ Good - specific fields only -->
<CrudTable entity="order" :expand-fields="['notes', 'metadata']" ... />
```

### 3. Disable Auto-Refresh When Not Needed

```vue
<!-- ❌ Unnecessary refresh on static data -->
<DataTable entity="historical_data" :refresh-interval="5000" ... />

<!-- ✅ Static data, no auto-refresh -->
<DataTable entity="historical_data" ... />

<!-- ✅ Use refresh only for live data -->
<DataTable entity="system_logs" :refresh-interval="10000" infinite />
```

### 4. Optimize Search Fields

```vue
<!-- ❌ Too many search fields slows down queries -->
<CrudTable :search-fields="['field1', 'field2', ..., 'field15']" ... />

<!-- ✅ Limit to most commonly searched fields -->
<CrudTable :search-fields="['name', 'email', 'status']" ... />
```

### 5. Use Custom List Endpoint for Complex Queries

```vue
<!-- Instead of filtering in client, create optimized endpoint -->
<DataTable entity="analytics" list-action="/aggregated-stats" ... />
```

---

## mergeWithServer

Control how server metadata and custom configurations are merged.

### How It Works

**`mergeWithServer: true` (CrudTable default):**

1. Loops through **server fields**
2. Server field properties (type, required, etc.) **override** custom properties
3. Custom fields without matching server fields are ignored
4. Result: All server-defined fields with optional custom overrides

**`mergeWithServer: false` (DataTable default):**

1. Loops through **custom fields** only
2. Custom properties **override** server properties
3. Only shows fields you explicitly define
4. Result: Full control over displayed fields

### When to Use Each

**Use `true` when:**

- You want all server-defined fields automatically
- Server is source of truth for field structure
- You occasionally need to override specific field properties
- Rapid prototyping with automatic UI generation

**Use `false` when:**

- You need full control over which fields appear
- Custom UI requirements differ from server schema
- Building specialized views (dashboards, reports)
- DataTable for read-only custom layouts

### Examples

```vue
<!-- ✅ CrudTable - let server define everything -->
<CrudTable entity="user" :merge-with-server="true" ... />
<!-- Shows ALL server fields automatically -->

<!-- ✅ CrudTable - full custom control -->
<CrudTable entity="user" :merge-with-server="false" :headers="customHeaders" :search-fields="customSearch" ... />
<!-- Shows ONLY your custom fields -->

<!-- ✅ DataTable - custom headers only -->
<DataTable entity="log" :merge-with-server="false" :headers="customHeaders" />
<!-- Default for DataTable, shows only custom headers -->

<!-- ⚠️ Avoid - DataTable with mergeWithServer=true but empty headers -->
<DataTable entity="user" :merge-with-server="true" :headers="[]" />
<!-- Won't show any fields because headers is empty -->
```

### Property Override Behavior

With `mergeWithServer: true`:

```typescript
// Server field
{ name: "email", type: "email", required: true, list: true }

// Custom field
{ name: "email", title: "User Email", width: "200px" }

// Result
{
  name: "email",
  type: "email",           // From server
  required: true,          // From server
  list: true,              // From server
  title: "User Email",     // From custom (server doesn't have title)
  width: "200px"           // From custom (server doesn't have width)
}
```

With `mergeWithServer: false`:

```typescript
// Server field
{ name: "email", type: "email", required: true }

// Custom field
{ name: "email", title: "User Email", required: false }

// Result
{
  name: "email",
  title: "User Email",     // From custom
  required: false,         // From custom (overrides server)
  type: "email"            // From server (merged in for metadata)
}
```
