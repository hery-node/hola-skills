# Common Application Patterns

Real-world application patterns using Hola meta-programming framework.

## E-Commerce Platform

### Entities

```
Customer → Order → OrderItem ← Product ← Category
                             ← Review
```

### Server Implementation

```javascript
// router/category.ts
import { init_router } from "hola-server";

export default init_router({
  collection: "category",
  primary_keys: ["name"],
  ref_label: "name",
  fields: [
    { name: "name", type: "string", required: true, update: false },
    { name: "description", type: "text", list: false },
    { name: "icon", type: "string" },
    { name: "parentCategory", type: "string", ref: "category" }
  ],
  creatable: true,
  readable: true,
  updatable: true,
  deleteable: true,
  roles: ["admin:*", "customer:rs"]
});

// router/product.ts
import { init_router } from "hola-server";

export default init_router({
  collection: "product",
  primary_keys: ["sku"],
  ref_label: "name",
  fields: [
    { name: "sku", type: "string", required: true, update: false },
    { name: "name", type: "string", required: true },
    { name: "description", type: "text", create: true, update: true, list: false },
    { name: "price", type: "number", required: true },
    { name: "salePrice", type: "number" },
    { name: "stock", type: "number", default: 0 },
    { name: "category", type: "string", ref: "category", required: true },
    { name: "images", type: "array" },
    { name: "status", type: "product_status", default: 0 },
    { name: "featured", type: "boolean", default: false },
    { name: "avgRating", type: "number", default: 0, sys: true },
    { name: "reviewCount", type: "number", default: 0, sys: true }
  ],
  creatable: true,
  readable: true,
  updatable: true,
  deleteable: true,
  exportable: true,
  roles: ["admin:*", "customer:rs"]
});

// router/order.ts
import { init_router, get_entity, oid_query } from "hola-server";

const ORDER_STATUS = { PENDING: 0, CONFIRMED: 1, SHIPPED: 2, DELIVERED: 3, CANCELLED: 4 };

export default init_router({
  collection: "order",
  primary_keys: ["orderNo"],
  user_field: "customer",
  fields: [
    { name: "orderNo", type: "string", required: true, sys: true },
    { name: "customer", type: "string", ref: "customer", required: true, sys: true },
    { name: "items", type: "array", required: true },
    { name: "subtotal", type: "number", sys: true },
    { name: "tax", type: "number", sys: true },
    { name: "total", type: "number", sys: true },
    { name: "status", type: "order_status", default: ORDER_STATUS.PENDING },
    { name: "shippedAt", type: "date", sys: true },
    { name: "deliveredAt", type: "date", sys: true }
  ],
  creatable: true,
  readable: true,
  updatable: true,

  before_create: async (...args: unknown[]) => {
    const data = args[1] as Record<string, unknown>;
    data.orderNo = `ORD-${Date.now()}`;

    const items = data.items as Array<{ productId: string; quantity: number; price: number }>;
    data.subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    data.tax = data.subtotal * 0.1;
    data.total = data.subtotal + data.tax;
  },

  after_create: async (...args: unknown[]) => {
    const data = args[1] as Record<string, unknown>;
    const productEntity = get_entity("product");

    const items = data.items as Array<{ productId: string; quantity: number }>;
    for (const item of items) {
      const query = oid_query(item.productId);
      if (query) {
        await productEntity.update(query, { $inc: { stock: -item.quantity } });
      }
    }
  },

  before_update: async (...args: unknown[]) => {
    const data = args[2] as Record<string, unknown>;
    if (data.status === ORDER_STATUS.SHIPPED) {
      data.shippedAt = new Date();
    } else if (data.status === ORDER_STATUS.DELIVERED) {
      data.deliveredAt = new Date();
    }
  }
});
```

### Client Implementation

```vue
<!-- views/ProductsView.vue -->
<template>
  <h-crud entity="product" mode="crudsp" :sortKey="['category', 'name']" :sortDesc="[false, false]" itemLabelKey="name" />
</template>

<!-- views/OrdersView.vue -->
<template>
  <h-crud entity="order" mode="crusp" :sortKey="['createdAt']" :sortDesc="[true]" itemLabelKey="orderNo" :filter="userFilter" />
</template>

<script setup>
import { computed } from "vue";

const user = computed(() => {
  const stored = sessionStorage.getItem("user");
  return stored ? JSON.parse(stored) : null;
});

const userFilter = computed(() => {
  return user.value?.role === "admin" ? {} : { customer: user.value?._id };
});
</script>
```

## Blog/CMS Platform

### Entities

```
User → Post → Comment
       ↓
    Category
```

### Server Implementation

```javascript
// router/post.ts
import { init_router } from "hola-server";

const POST_STATUS = { DRAFT: 0, PUBLISHED: 1, ARCHIVED: 2 };

export default init_router({
  collection: "post",
  primary_keys: ["slug"],
  ref_label: "title",
  user_field: "author",
  fields: [
    { name: "slug", type: "string", required: true, update: false },
    { name: "title", type: "string", required: true },
    { name: "content", type: "text", required: true, list: false },
    { name: "excerpt", type: "string", list: true },
    { name: "author", type: "string", ref: "user", sys: true, required: true },
    { name: "category", type: "string", ref: "category" },
    { name: "tags", type: "array" },
    { name: "status", type: "post_status", default: POST_STATUS.DRAFT },
    { name: "publishedAt", type: "date" },
    { name: "featured", type: "boolean", default: false },
    { name: "viewCount", type: "number", default: 0, sys: true },
    { name: "commentCount", type: "number", default: 0, sys: true }
  ],
  creatable: true,
  readable: true,
  updatable: true,
  deleteable: true,

  before_create: async (...args: unknown[]) => {
    const data = args[1] as Record<string, unknown>;
    data.slug = (data.title as string).toLowerCase().replace(/[^a-z0-9]+/g, '-');
  },

  before_update: async (...args: unknown[]) => {
    const data = args[2] as Record<string, unknown>;
    if (data.status === POST_STATUS.PUBLISHED && !data.publishedAt) {
      data.publishedAt = new Date();
    }
  },

  list_query: (...args: unknown[]) => {
    const ctx = args[2] as { user?: { _id: string; role: string } };
    const user = ctx.user;  // User attached by holaAuth plugin

    if (user?.role === "admin") return {};
    if (user?.role === "author") return { author: user._id };
    return { status: POST_STATUS.PUBLISHED };
  }
});

// router/comment.ts
import { init_router, get_entity, oid_query } from "hola-server";

export default init_router({
  collection: "comment",
  primary_keys: ["post", "author", "createdAt"],
  fields: [
    { name: "post", type: "string", ref: "post", required: true },
    { name: "author", type: "string", ref: "user", required: true, sys: true },
    { name: "content", type: "text", required: true },
    { name: "approved", type: "boolean", default: false, sys: true }
  ],
  creatable: true,
  readable: true,
  updatable: true,
  deleteable: true,

  after_create: async (...args: unknown[]) => {
    const data = args[1] as Record<string, unknown>;
    const postEntity = get_entity("post");

    const query = oid_query(data.post as string);
    if (query) {
      await postEntity.update(query, { $inc: { commentCount: 1 } });
    }
  }
});
```

### Client Implementation

```vue
<!-- views/PostsView.vue -->
<template>
  <h-crud entity="post" mode="crudsop" :sortKey="['publishedAt']" :sortDesc="[true]" itemLabelKey="title" :actions="postActions" />
</template>

<script setup>
import { useRouter } from "vue-router";

const router = useRouter();

const postActions = [
  {
    icon: "mdi-eye",
    label: "Preview",
    click: (item) => {
      window.open(`/preview/${item.slug}`, "_blank");
    },
  },
];
</script>
```

## CRM (Customer Relationship Management)

### Entities

```
Company → Contact → Deal → Activity
                      ↓
                    Task
```

### Server Implementation

```javascript
// router/deal.ts
import { init_router } from "hola-server";

const DEAL_STAGE = {
  LEAD: 0,
  QUALIFIED: 1,
  PROPOSAL: 2,
  NEGOTIATION: 3,
  CLOSED_WON: 4,
  CLOSED_LOST: 5
};

export default init_router({
  collection: "deal",
  primary_keys: ["name"],
  ref_label: "name",
  user_field: "owner",
  fields: [
    { name: "name", type: "string", required: true },
    { name: "company", type: "string", ref: "company", required: true },
    { name: "contact", type: "string", ref: "contact", required: true },
    { name: "amount", type: "number", required: true },
    { name: "stage", type: "deal_stage", default: DEAL_STAGE.LEAD },
    { name: "probability", type: "number", default: 0 },
    { name: "owner", type: "string", ref: "user", sys: true, required: true },
    { name: "expectedCloseDate", type: "date" },
    { name: "closedDate", type: "date", sys: true },
    { name: "notes", type: "text", list: false }
  ],
  creatable: true,
  readable: true,
  updatable: true,
  deleteable: true,

  before_update: async (...args: unknown[]) => {
    const data = args[2] as Record<string, unknown>;

    if (data.stage === DEAL_STAGE.CLOSED_WON || data.stage === DEAL_STAGE.CLOSED_LOST) {
      data.closedDate = new Date();
      data.probability = data.stage === DEAL_STAGE.CLOSED_WON ? 100 : 0;
    }
  }
});
```

### Client Implementation (Kanban)

```vue
<!-- views/DealsView.vue -->
<template>
  <h-kanban entity="deal" :items="deals" statusField="stage" titleField="name" :displayFields="['company', 'amount', 'owner']" @update="handleStageChange" />
</template>

<script setup>
import { ref, onMounted } from "vue";
import { api } from "@/core/api";

const deals = ref([]);

onMounted(async () => {
  const response = await api.get("/deal");
  deals.value = response.data;
});

const handleStageChange = async ({ item, newStatus }) => {
  await api.put(`/deal/${item._id}`, { stage: newStatus });
  await loadDeals();
};
</script>
```

## Project Management

### Entities

```
Project → Task → Subtask
            ↓
        Comment
```

### Server Implementation

```javascript
// router/task.ts
import { init_router, oid_query } from "hola-server";

const TASK_STATUS = { TODO: 0, IN_PROGRESS: 1, REVIEW: 2, DONE: 3 };
const TASK_PRIORITY = { LOW: 0, MEDIUM: 1, HIGH: 2, URGENT: 3 };

export default init_router({
  collection: "task",
  primary_keys: ["project", "title"],
  ref_label: "title",
  fields: [
    { name: "project", type: "string", ref: "project", required: true },
    { name: "title", type: "string", required: true },
    { name: "description", type: "text", list: false },
    { name: "assignee", type: "string", ref: "user" },
    { name: "status", type: "task_status", default: TASK_STATUS.TODO },
    { name: "priority", type: "task_priority", default: TASK_PRIORITY.MEDIUM },
    { name: "dueDate", type: "date" },
    { name: "estimatedHours", type: "number" },
    { name: "actualHours", type: "number", sys: true },
    { name: "completedAt", type: "date", sys: true },
    { name: "tags", type: "array" }
  ],
  creatable: true,
  readable: true,
  updatable: true,
  deleteable: true,

  before_update: async (...args: unknown[]) => {
    const _id = args[0] as string;
    const entity = args[1];
    const data = args[2] as Record<string, unknown>;

    if (data.status === TASK_STATUS.DONE) {
      const query = oid_query(_id);
      if (query) {
        const task = await entity.find_one(query);
        if (task.status !== TASK_STATUS.DONE) {
          data.completedAt = new Date();
        }
      }
    }
  }
});
```

### Client Implementation (Calendar + Table)

```vue
<!-- views/TasksView.vue -->
<template>
  <v-container>
    <v-tabs v-model="tab">
      <v-tab value="board">Board</v-tab>
      <v-tab value="table">Table</v-tab>
      <v-tab value="calendar">Calendar</v-tab>
    </v-tabs>

    <v-window v-model="tab">
      <v-window-item value="board">
        <h-kanban entity="task" :items="tasks" statusField="status" titleField="title" :displayFields="['assignee', 'dueDate', 'priority']" />
      </v-window-item>

      <v-window-item value="table">
        <h-crud entity="task" mode="crudsp" :sortKey="['dueDate']" :sortDesc="[false]" itemLabelKey="title" />
      </v-window-item>

      <v-window-item value="calendar">
        <h-calendar entity="task" :items="tasks" startField="dueDate" titleField="title" />
      </v-window-item>
    </v-window>
  </v-container>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { api } from "@/core/api";

const tab = ref("board");
const tasks = ref([]);

onMounted(async () => {
  const response = await api.get("/task");
  tasks.value = response.data;
});
</script>
```

## Multi-Tenancy Pattern

### Server Implementation

```javascript
// router/data.ts (tenant-isolated)
import { init_router } from "hola-server";

export default init_router({
  collection: "data",
  primary_keys: ["tenant", "key"],
  ref_label: "key",
  fields: [
    { name: "tenant", type: "string", sys: true, required: true },
    { name: "key", type: "string", required: true },
    { name: "value", type: "obj", required: true }
  ],
  creatable: true,
  readable: true,
  updatable: true,
  deleteable: true,

  before_create: async (...args: unknown[]) => {
    const data = args[1] as Record<string, unknown>;
    const ctx = args[2] as { user?: { tenantId: string } };
    data.tenant = ctx.user?.tenantId;
  },

  list_query: (...args: unknown[]) => {
    const ctx = args[2] as { user?: { tenantId: string } };
    const tenantId = ctx.user?.tenantId;
    return { tenant: tenantId };
  }
});
```

## File Upload Pattern

### Server Implementation

```javascript
// router/document.ts
import { init_router } from "hola-server";

// Note: Elysia/Bun handles file uploads natively
export default init_router({
  collection: "document",
  primary_keys: ["filename"],
  ref_label: "title",
  fields: [
    { name: "title", type: "string", required: true },
    { name: "filename", type: "string", sys: true, required: true },
    { name: "filepath", type: "string", sys: true, required: true },
    { name: "filesize", type: "number", sys: true },
    { name: "mimetype", type: "string", sys: true },
    { name: "uploadedBy", type: "string", ref: "user", sys: true },
  ],
  creatable: true,
  readable: true,
  deleteable: true,
});
```

## Approval Workflow Pattern

### Server Implementation

```javascript
// router/request.ts
import { init_router } from "hola-server";
import { NO_RIGHTS } from "hola-server";

const REQUEST_STATUS = { PENDING: 0, APPROVED: 1, REJECTED: 2 };

export default init_router({
  collection: "request",
  primary_keys: ["requestNo"],
  user_field: "requester",
  fields: [
    { name: "requestNo", type: "string", sys: true, required: true },
    { name: "requester", type: "string", ref: "user", sys: true, required: true },
    { name: "title", type: "string", required: true },
    { name: "description", type: "text", required: true },
    { name: "status", type: "request_status", default: REQUEST_STATUS.PENDING },
    { name: "approver", type: "string", ref: "user" },
    { name: "approvedAt", type: "date", sys: true },
    { name: "rejectionReason", type: "text" }
  ],
  creatable: true,
  readable: true,
  updatable: true,

  before_update: async (...args: unknown[]) => {
    const data = args[2] as Record<string, unknown>;
    const ctx = args[3] as { user?: { _id: string; role: string } };
    const user = ctx.user;  // User attached by holaAuth plugin

    // Only approvers can change status
    if (data.status !== undefined && user?.role !== "approver" && user?.role !== "admin") {
      throw { code: NO_RIGHTS, msg: "Only approvers can change request status" };
    }

    if (data.status === REQUEST_STATUS.APPROVED) {
      data.approver = user?._id;
      data.approvedAt = new Date();
    }
  }
});
```

---

These patterns demonstrate real-world application structures using Hola meta-programming. Combine and adapt them to your specific requirements.
