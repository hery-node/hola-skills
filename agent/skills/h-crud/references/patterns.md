# Common Patterns

Real-world usage examples and complete implementations.

## Table of Contents

- [Pattern 1: Read-Only Table with Custom Actions](#pattern-1-read-only-table-with-custom-actions)
- [Pattern 2: Master-Detail View](#pattern-2-master-detail-view)
- [Pattern 3: Filtered Table with URL Query](#pattern-3-filtered-table-with-url-query)
- [Pattern 3b: Permanent Filtering with filter Prop](#pattern-3b-permanent-filtering-with-filter-prop)
- [Pattern 4: Custom Create Route](#pattern-4-custom-create-route)
- [Pattern 5: Conditional Actions](#pattern-5-conditional-actions)
- [Pattern 6: Dashboard Table](#pattern-6-dashboard-table)
- [Complete Example: Full-Featured User Management](#complete-example-full-featured-user-management)

---

## Pattern 1: Read-Only Table with Custom Actions

Use DataTable for reports, logs, or analytics with download/export actions.

```vue
<template>
  <DataTable entity="report" :headers="headers" searchable :item-actions="actions" />
</template>

<script setup lang="ts">
import { DataTable } from "@/components";
import type { TableHeader, ItemAction } from "@/components";

const headers: TableHeader[] = [
  { title: "Report Name", key: "name", sortable: true },
  { title: "Generated", key: "created_at", sortable: true },
  { title: "Status", key: "status" },
];

const actions: ItemAction[] = [
  {
    icon: "mdi-download",
    tooltip: "Download",
    handle: async (item) => {
      await downloadReport(item._id);
    },
  },
  {
    icon: "mdi-email",
    tooltip: "Send Email",
    handle: async (item) => {
      await emailReport(item._id);
    },
  },
];

const downloadReport = async (id: string) => {
  // Download logic
};

const emailReport = async (id: string) => {
  // Email logic
};
</script>
```

---

## Pattern 2: Master-Detail View

Split screen with master list on left, detail table on right.

```vue
<template>
  <v-container>
    <v-row>
      <v-col cols="4">
        <!-- Master list -->
        <DataTable entity="project" :headers="projectHeaders" :item-actions="selectActions" />
      </v-col>
      <v-col cols="8">
        <!-- Detail view -->
        <CrudTable v-if="selectedProjectId" entity="task" :filter="{ project: selectedProjectId }" :sort-key="['priority']" :sort-desc="[true]" item-label-key="title" :search-fields="['title', 'status', 'assignee']" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { DataTable, CrudTable } from "@/components";
import type { TableHeader, ItemAction } from "@/components";

const selectedProjectId = ref("");

const projectHeaders: TableHeader[] = [
  { title: "Project", key: "name", sortable: true },
  { title: "Status", key: "status" },
];

const selectActions: ItemAction[] = [
  {
    icon: "mdi-arrow-right",
    tooltip: "View Tasks",
    handle: (item) => {
      selectedProjectId.value = item._id;
    },
  },
];
</script>
```

---

## Pattern 3: Filtered Table with URL Query

Pre-filter table based on URL query parameters.

```vue
<template>
  <CrudTable entity="order" :sort-key="['created_at']" :sort-desc="[true]" item-label-key="order_number" :search-fields="searchFields" />
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const searchFields = ref([]);

onMounted(() => {
  // Pre-filter by URL query
  // Example: /orders?status=pending
  const status = route.query.status;
  if (status) {
    searchFields.value = [{ name: "status", default: status }];
  }
});
</script>
```

---

## Pattern 3b: Permanent Filtering with filter Prop

Apply permanent server-side filters that are merged with search form values.

### Project-Scoped Data

```vue
<template>
  <CrudTable entity="prd" :filter="filter" :sort-key="['created_at']" :sort-desc="[true]" item-label-key="name" />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useProject } from "@/composables/useProject";

const { currentProject } = useProject();

// Only show PRDs for current project
const filter = computed(() => (currentProject.value ? { project: currentProject.value._id } : {}));
</script>
```

### Context-Based Filtering

```vue
<template>
  <CrudTable entity="user_skill" :filter="listFilter" :hide-columns="hideColumns" :sort-key="['added_at']" :sort-desc="[true]" item-label-key="name" />
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

const isProjectContext = computed(() => !!projectId.value);
const projectId = ref<string | null>(null);

// Different filter based on context
const listFilter = computed(
  () =>
    isProjectContext.value
      ? { project: projectId.value } // Project-specific skills
      : { scope: 0 }, // Global skills only
);

// Hide columns based on context
const hideColumns = computed(() => (isProjectContext.value ? ["user"] : ["scope", "project", "user"]));
</script>
```

### Multiple Filter Conditions

```vue
<template>
  <CrudTable entity="task" :filter="filter" :sort-key="['priority', 'created_at']" :sort-desc="[false, true]" item-label-key="title" />
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

const selectedCategory = ref("development");
const currentUser = ref({ _id: "user123" });

const filter = computed(() => ({
  status: "active",
  category: selectedCategory.value,
  created_by: currentUser.value._id,
}));
</script>
```

---

## Pattern 4: Custom Create Route

Redirect to dedicated creation page instead of dialog for complex forms.

```vue
<template>
  <CrudTable entity="complex_entity" :sort-key="['name']" :sort-desc="[false]" item-label-key="name" create-route="/complex-entity/new" />
</template>
```

When user clicks Create, navigates to `/complex-entity/new` instead of showing dialog.

**Use when:**

- Form has many steps/sections
- Need file uploads or rich editors
- Complex validation logic
- Better UX with full-page form

---

## Pattern 5: Conditional Actions

Show different actions based on item state.

```vue
<template>
  <CrudTable entity="invoice" :sort-key="['invoice_number']" :sort-desc="[true]" item-label-key="invoice_number" :actions="conditionalActions" />
</template>

<script setup lang="ts">
import type { ItemAction } from "@/components";

const conditionalActions: ItemAction[] = [
  {
    icon: "mdi-send",
    color: "primary",
    tooltip: "Send to Customer",
    handle: async (item) => {
      await sendInvoice(item._id);
    },
    shown: (item) => item.status === 1 && !item.sent, // Draft and not sent
  },
  {
    icon: "mdi-cash",
    color: "success",
    tooltip: "Mark as Paid",
    handle: async (item) => {
      await markPaid(item._id);
    },
    shown: (item) => item.status === 2 && !item.paid, // Sent and not paid
  },
  {
    icon: "mdi-cancel",
    color: "error",
    tooltip: "Void",
    handle: async (item) => {
      await voidInvoice(item._id);
    },
    shown: (item) => item.status !== 3, // Not already voided
  },
];

const sendInvoice = async (id: string) => {
  // Send invoice logic
};

const markPaid = async (id: string) => {
  // Mark paid logic
};

const voidInvoice = async (id: string) => {
  // Void invoice logic
};
</script>
```

---

## Pattern 6: Dashboard Table

Compact table for dashboard widgets without toolbar.

```vue
<template>
  <v-card>
    <v-card-title>Recent Orders</v-card-title>
    <v-card-text>
      <DataTable entity="order" :headers="dashboardHeaders" :infinite="true" :item-actions="quickActions" hide-toolbar />
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import type { TableHeader, ItemAction } from "@/components";

const router = useRouter();

const dashboardHeaders: TableHeader[] = [
  { title: "Order #", key: "order_number", width: "120px" },
  { title: "Customer", key: "customer_name" },
  { title: "Total", key: "total", align: "end", width: "100px" },
  { title: "Status", key: "status", width: "100px" },
];

const quickActions: ItemAction[] = [
  {
    icon: "mdi-eye",
    tooltip: "View Details",
    handle: (item) => {
      router.push(`/orders/${item._id}`);
    },
  },
];
</script>
```

---

## Complete Example: Full-Featured User Management

Full implementation showcasing all capabilities.

```vue
<template>
  <v-container>
    <CrudTable entity="user" :sort-key="['created_at']" :sort-desc="[true]" item-label-key="email" entity-label="System Users" create-view="basic" update-view="full" :headers="headers" :search-fields="searchFields" :edit-fields="editFields" :actions="customActions" :toolbars="toolbars" :batch-toolbars="batchToolbars" :expand-fields="['last_login', 'ip_address', 'notes']" :hide-columns="['password_hash']" :chip-fields-map="chipConfig" />
  </v-container>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { CrudTable } from "@/components";
import type { TableHeader, ItemAction, ToolbarAction } from "@/components";
import { axiosPost } from "@/core/axios";

// Custom headers
const headers: TableHeader[] = [
  { title: "Email", key: "email", sortable: true, width: "250px" },
  { title: "Name", key: "name", sortable: true },
  { title: "Role", key: "role", align: "center", width: "120px" },
  { title: "Status", key: "status", align: "center", width: "120px" },
  { title: "Created", key: "created_at", sortable: true, width: "180px" },
];

// Search form fields
const searchFields = ["email", "name", "role", "status"];

// Edit form fields
const editFields = [{ name: "email", required: true }, { name: "name", required: true }, { name: "role", default: 0 }, { name: "status", default: 1 }, { name: "phone" }, { name: "department" }];

// Custom row actions
const customActions: ItemAction[] = [
  {
    icon: "mdi-key-variant",
    color: "warning",
    tooltip: "Reset Password",
    handle: async (item) => {
      await axiosPost(`/user/${item._id}/reset-password`);
      alert("Password reset email sent");
    },
    shown: (item) => item.status === 1, // Only for active users
  },
  {
    icon: "mdi-shield-lock",
    color: "error",
    tooltip: "Lock Account",
    handle: async (item) => {
      await axiosPost(`/user/${item._id}/lock`);
    },
    shown: (item) => item.status !== 3, // Not already locked
  },
];

// Toolbar buttons
const toolbars: ToolbarAction[] = [
  {
    icon: "mdi-download",
    tooltip: "Export Users",
    click: () => {
      exportUsers();
    },
  },
  {
    icon: "mdi-email-multiple",
    tooltip: "Send Announcement",
    click: () => {
      openAnnouncementDialog();
    },
  },
];

// Batch mode toolbars
const batchToolbars: ToolbarAction[] = [
  {
    icon: "mdi-account-multiple-check",
    color: "success",
    tooltip: "Activate Selected",
    click: async () => {
      await bulkActivate();
    },
  },
  {
    icon: "mdi-email-send",
    tooltip: "Email Selected",
    click: () => {
      bulkEmail();
    },
  },
];

// Chip edit configuration
const chipConfig = {
  role: [
    { name: "role", required: true },
    { name: "effective_date", default: new Date() },
  ],
  status: [{ name: "status", required: true }, { name: "reason" }],
};

// Helper functions
const exportUsers = () => {
  // Export CSV logic
  console.log("Exporting users...");
};

const openAnnouncementDialog = () => {
  // Open announcement dialog
  console.log("Opening announcement dialog...");
};

const bulkActivate = async () => {
  // Bulk activation logic
  console.log("Activating selected users...");
};

const bulkEmail = () => {
  // Bulk email logic
  console.log("Sending email to selected users...");
};
</script>
```

### Features Demonstrated

1. **Custom headers** with alignment and widths
2. **Custom search fields** - only email, name, role, status
3. **Custom edit fields** with defaults and required flags
4. **Conditional row actions** - reset password (active only), lock account
5. **Custom toolbars** - export and announcement
6. **Batch toolbars** - bulk activate and email
7. **Expandable rows** - last_login, ip_address, notes
8. **Hide columns** - password_hash
9. **Chip editing** - quick role and status changes
10. **Different views** - basic for create, full for update
11. **Custom labels** - "System Users" entity label
