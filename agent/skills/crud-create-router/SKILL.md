---
name: crud-create-router
description: Override default create forms with custom routes for complex creation workflows. Use when the user needs multi-step wizards, custom UI for creating records, or complex creation processes.
---

# CRUD Create Router (Custom Create Workflows)

Override the default create form with custom routes for complex creation workflows.

## When to Use This Skill

- User needs a **multi-step wizard** for creating records
- User wants **custom UI** beyond a simple form (drag-drop, visual builders)
- Creation requires **complex workflow** (product selection → shipping → payment)
- User needs **external integrations** during creation process
- Default form is **too simple** for the business logic

## Quick Answer

**Use `createRoute` to redirect create actions to a custom page:**

```vue
<!-- hola-web/src/views/OrderView.vue -->
<h-crud
  entity="order"
  create-route="/order/wizard"
  item-label-key="orderNumber">
  <!-- When user clicks 'Add' button, navigates to /order/wizard -->
</h-crud>
```

## When to Use Custom Create Routes

### ✅ Use Custom Routes For

- **Multi-step processes** - User onboarding (info → preferences → verification)
- **Complex selection** - Order creation (products → shipping → payment → review)
- **Conditional flows** - Different forms based on selections
- **Visual builders** - Drag-and-drop interfaces, canvas editors
- **External API calls** - Payment processing, address validation
- **File uploads with preview** - Profile creation with photo cropping
- **Batch creation** - Import multiple records at once

### ❌ Don't Use Custom Routes For

- **Simple forms** - Use default create form (it's automatic!)
- **Adding 1-2 extra fields** - Just add them to entity definition
- **Basic validation** - Use server-side validation in entity
- **Cosmetic changes** - Use `createView` property for form customization

## Step-by-Step Instructions

### Step 1: Add `createRoute` to CRUD Table

**Location:** `hola-web/src/views/[Entity]View.vue`

```vue
<template>
  <h-crud
    entity="order"
    create-route="/order/create-wizard"
    item-label-key="orderNumber">
  </h-crud>
</template>
```

**What happens:**
1. User clicks "Add" button
2. Instead of showing default create dialog
3. Router navigates to `/order/create-wizard`
4. Your custom component handles creation

### Step 2: Create Custom Creation Component

**Location:** `hola-web/src/views/OrderCreateWizard.vue`

```vue
<template>
  <v-container>
    <v-card>
      <v-card-title>Create New Order</v-card-title>
      
      <v-card-text>
        <v-stepper v-model="step">
          <v-stepper-header>
            <v-stepper-item :complete="step > 1" :value="1">
              Products
            </v-stepper-item>
            <v-divider></v-divider>
            <v-stepper-item :complete="step > 2" :value="2">
              Shipping
            </v-stepper-item>
            <v-divider></v-divider>
            <v-stepper-item :value="3">
              Review
            </v-stepper-item>
          </v-stepper-header>

          <v-stepper-window>
            <!-- Step 1: Product Selection -->
            <v-stepper-window-item :value="1">
              <h3>Select Products</h3>
              <!-- Product selection UI -->
              <v-btn @click="step = 2">Next</v-btn>
            </v-stepper-window-item>
            
            <!-- Step 2: Shipping Info -->
            <v-stepper-window-item :value="2">
              <h3>Shipping Information</h3>
              <h-form entity="order" :fields="shippingFields" v-model="orderData"></h-form>
              <v-btn @click="step = 1">Back</v-btn>
              <v-btn @click="step = 3">Next</v-btn>
            </v-stepper-window-item>
            
            <!-- Step 3: Review & Submit -->
            <v-stepper-window-item :value="3">
              <h3>Review Order</h3>
              <!-- Display order summary -->
              <v-btn @click="step = 2">Back</v-btn>
              <v-btn color="success" @click="submitOrder">Create Order</v-btn>
            </v-stepper-window-item>
          </v-stepper-window>
        </v-stepper>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      step: 1,
      orderData: {
        products: [],
        shippingAddress: '',
        customerName: ''
      },
      shippingFields: [
        { name: 'customerName', type: 'string', label: 'Customer Name', required: true },
        { name: 'shippingAddress', type: 'text', label: 'Shipping Address', required: true }
      ]
    };
  },
  
  methods: {
    async submitOrder() {
      try {
        // Create order via API
        await this.$axios.post('/order', this.orderData);
        
        // Show success message
        this.$emit('show-alert', { type: 'success', msg: 'Order created successfully!' });
        
        // Navigate back to order list
        this.$router.push('/orders');
      } catch (error) {
        this.$emit('show-alert', { type: 'error', msg: error.message });
      }
    }
  }
};
</script>
```

### Step 3: Add Route Configuration

**Location:** `hola-web/src/router/index.ts`

```javascript
const routes = [
  {
    path: '/orders',
    name: 'OrderList',
    component: () => import('@/views/OrderView.vue')  // CRUD table
  },
  {
    path: '/order/create-wizard',
    name: 'OrderCreateWizard',
    component: () => import('@/views/OrderCreateWizard.vue')  // Custom wizard
  }
];
```

### Step 4: Test the Flow

1. Go to `/orders` (CRUD table view)
2. Click "Add" button
3. Redirects to `/order/create-wizard`
4. Complete the multi-step wizard
5. Submits order and returns to `/orders`

## Common Patterns

### Pattern 1: Multi-Step Wizard

Use `v-stepper` for step-by-step creation:

```vue
<v-stepper v-model="step">
  <v-stepper-header>
    <v-stepper-item :value="1">Step 1</v-stepper-item>
    <v-stepper-item :value="2">Step 2</v-stepper-item>
    <v-stepper-item :value="3">Step 3</v-stepper-item>
  </v-stepper-header>
  
  <v-stepper-window>
    <v-stepper-window-item :value="1">
      <!-- Step 1 content -->
    </v-stepper-window-item>
    <v-stepper-window-item :value="2">
      <!-- Step 2 content -->
    </v-stepper-window-item>
    <v-stepper-window-item :value="3">
      <!-- Step 3 content -->
    </v-stepper-window-item>
  </v-stepper-window>
</v-stepper>
```

### Pattern 2: Conditional Steps

Show different steps based on user selections:

```vue
<v-stepper v-model="step">
  <v-stepper-window-item :value="1">
    <v-radio-group v-model="orderType">
      <v-radio label="Standard Order" value="standard"></v-radio>
      <v-radio label="Custom Order" value="custom"></v-radio>
    </v-radio-group>
  </v-stepper-window-item>
  
  <!-- Standard order flow -->
  <v-stepper-window-item v-if="orderType === 'standard'" :value="2">
    <!-- Standard fields -->
  </v-stepper-window-item>
  
  <!-- Custom order flow -->
  <v-stepper-window-item v-if="orderType === 'custom'" :value="2">
    <!-- Custom fields -->
  </v-stepper-window-item>
</v-stepper>
```

### Pattern 3: Progress Indicator

Show progress percentage:

```vue
<v-progress-linear
  :model-value="(step / totalSteps) * 100"
  color="primary"
  height="8">
</v-progress-linear>

<p>Step {{ step }} of {{ totalSteps }}</p>
```

### Pattern 4: Validation Per Step

Validate each step before moving forward:

```javascript
methods: {
  async nextStep() {
    if (this.step === 1 && !this.validateStep1()) {
      this.$emit('show-alert', { type: 'error', msg: 'Please fill all required fields' });
      return;
    }
    this.step++;
  },
  
  validateStep1() {
    return this.orderData.customerName && this.orderData.products.length > 0;
  }
}
```

## Alternative: Using `@create` Event

For simpler cases (no routing needed), intercept create button with an event:

```vue
<template>
  <h-crud
    entity="task"
    @create="showCustomDialog">
  </h-crud>
  
  <!-- Custom create dialog -->
  <v-dialog v-model="showDialog">
    <v-card>
      <v-card-title>Custom Create Form</v-card-title>
      <v-card-text>
        <!-- Custom form content -->
      </v-card-text>
      <v-card-actions>
        <v-btn @click="createTask">Create</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  data() {
    return {
      showDialog: false,
      taskData: {}
    };
  },
  
  methods: {
    showCustomDialog() {
      this.showDialog = true;
    },
    
    async createTask() {
      await this.$axios.post('/task', this.taskData);
      this.showDialog = false;
      // Refresh table
    }
  }
};
</script>
```

**When to use `@create` vs `createRoute`:**

| Feature | `@create` Event | `createRoute` Property |
|---------|----------------|------------------------|
| Routing | No routing | Full page navigation |
| Complexity | Simple dialogs | Multi-step wizards |
| URL change | No | Yes (`/entity/create`) |
| Back button | Closes dialog | Navigates back |
| Best for | Quick customization | Complex workflows |

## Best Practices

### 1. Use Routes for Complex Flows

```javascript
// ✅ GOOD - Multi-step wizard needs routing
createRoute: "/order/wizard"

// ❌ BAD - Simple form doesn't need custom route
createRoute: "/user/create"  // Just use default form!
```

### 2. Always Navigate Back

After successful creation, return to the CRUD table:

```javascript
await this.$axios.post('/order', this.orderData);
this.$router.push('/orders');  // ← Important!
```

### 3. Show Progress Indicators

Use steppers, progress bars, or breadcrumbs:

```vue
<v-stepper v-model="step">
  <!-- Shows current step clearly -->
</v-stepper>

<v-progress-linear :model-value="progress"></v-progress-linear>
```

### 4. Enable Back Navigation

Allow users to go back and edit previous steps:

```vue
<v-btn @click="step--">Back</v-btn>
<v-btn @click="step++">Next</v-btn>
```

### 5. Validate Before Submit

Validate all steps before final submission:

```javascript
async submitOrder() {
  if (!this.validateAllSteps()) {
    this.$emit('show-alert', { type: 'error', msg: 'Please complete all required fields' });
    return;
  }
  
  await this.$axios.post('/order', this.orderData);
  this.$router.push('/orders');
}
```

### 6. Handle Errors Gracefully

Show clear error messages for validation and API errors:

```javascript
try {
  await this.$axios.post('/order', this.orderData);
  this.$router.push('/orders');
} catch (error) {
  if (error.response?.data?.message) {
    this.$emit('show-alert', { type: 'error', msg: error.response.data.message });
  } else {
    this.$emit('show-alert', { type: 'error', msg: 'Failed to create order' });
  }
}
```

## Complete Example: E-commerce Order Wizard

```vue
<!-- hola-web/src/views/OrderWizard.vue -->
<template>
  <v-container>
    <v-card max-width="800" class="mx-auto">
      <v-card-title>Create New Order - Step {{ step }} of 4</v-card-title>
      
      <v-card-text>
        <!-- Progress bar -->
        <v-progress-linear
          :model-value="(step / 4) * 100"
          color="primary"
          height="8"
          class="mb-6">
        </v-progress-linear>
        
        <v-stepper v-model="step" alt-labels>
          <v-stepper-header>
            <v-stepper-item :complete="step > 1" :value="1" title="Customer"></v-stepper-item>
            <v-divider></v-divider>
            <v-stepper-item :complete="step > 2" :value="2" title="Products"></v-stepper-item>
            <v-divider></v-divider>
            <v-stepper-item :complete="step > 3" :value="3" title="Shipping"></v-stepper-item>
            <v-divider></v-divider>
            <v-stepper-item :value="4" title="Review"></v-stepper-item>
          </v-stepper-header>

          <v-stepper-window>
            <!-- Step 1: Customer Info -->
            <v-stepper-window-item :value="1">
              <v-text-field v-model="order.customerName" label="Customer Name" required></v-text-field>
              <v-text-field v-model="order.customerEmail" label="Email" type="email" required></v-text-field>
              <v-text-field v-model="order.customerPhone" label="Phone"></v-text-field>
              
              <v-btn color="primary" @click="nextStep">Next</v-btn>
            </v-stepper-window-item>
            
            <!-- Step 2: Product Selection -->
            <v-stepper-window-item :value="2">
              <v-data-table
                :items="products"
                :headers="productHeaders"
                item-value="_id"
                show-select
                v-model="order.selectedProducts">
              </v-data-table>
              
              <v-btn @click="step--">Back</v-btn>
              <v-btn color="primary" @click="nextStep">Next</v-btn>
            </v-stepper-window-item>
            
            <!-- Step 3: Shipping -->
            <v-stepper-window-item :value="3">
              <v-textarea v-model="order.shippingAddress" label="Shipping Address" required></v-textarea>
              <v-select v-model="order.shippingMethod" :items="shippingMethods" label="Shipping Method"></v-select>
              
              <v-btn @click="step--">Back</v-btn>
              <v-btn color="primary" @click="nextStep">Next</v-btn>
            </v-stepper-window-item>
            
            <!-- Step 4: Review & Submit -->
            <v-stepper-window-item :value="4">
              <h3>Order Summary</h3>
              <p><strong>Customer:</strong> {{ order.customerName }}</p>
              <p><strong>Email:</strong> {{ order.customerEmail }}</p>
              <p><strong>Products:</strong> {{ order.selectedProducts.length }} items</p>
              <p><strong>Shipping:</strong> {{ order.shippingMethod }}</p>
              <p><strong>Total:</strong> ${{ orderTotal }}</p>
              
              <v-btn @click="step--">Back</v-btn>
              <v-btn color="success" @click="submitOrder" :loading="submitting">Create Order</v-btn>
            </v-stepper-window-item>
          </v-stepper-window>
        </v-stepper>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script>
export default {
  data() {
    return {
      step: 1,
      submitting: false,
      order: {
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        selectedProducts: [],
        shippingAddress: '',
        shippingMethod: 'standard'
      },
      products: [],
      productHeaders: [
        { title: 'Name', key: 'name' },
        { title: 'Price', key: 'price' }
      ],
      shippingMethods: ['Standard', 'Express', 'Next Day']
    };
  },
  
  computed: {
    orderTotal() {
      return this.order.selectedProducts.reduce((sum, p) => sum + p.price, 0);
    }
  },
  
  async mounted() {
    // Load products
    this.products = await this.$axios.get('/product');
  },
  
  methods: {
    nextStep() {
      if (!this.validateCurrentStep()) {
        return;
      }
      this.step++;
    },
    
    validateCurrentStep() {
      if (this.step === 1) {
        if (!this.order.customerName || !this.order.customerEmail) {
          this.$emit('show-alert', { type: 'error', msg: 'Please fill customer information' });
          return false;
        }
      }
      if (this.step === 2) {
        if (this.order.selectedProducts.length === 0) {
          this.$emit('show-alert', { type: 'error', msg: 'Please select at least one product' });
          return false;
        }
      }
      if (this.step === 3) {
        if (!this.order.shippingAddress) {
          this.$emit('show-alert', { type: 'error', msg: 'Please enter shipping address' });
          return false;
        }
      }
      return true;
    },
    
    async submitOrder() {
      this.submitting = true;
      try {
        await this.$axios.post('/order', this.order);
        this.$emit('show-alert', { type: 'success', msg: 'Order created successfully!' });
        this.$router.push('/orders');
      } catch (error) {
        this.$emit('show-alert', { type: 'error', msg: error.message });
      } finally {
        this.submitting = false;
      }
    }
  }
};
</script>
```

## Quick Reference

| Task | Code |
|------|------|
| Add custom route | `create-route="/entity/wizard"` |
| Stepper component | `<v-stepper v-model="step">` |
| Progress bar | `<v-progress-linear :model-value="progress">` |
| Navigate back | `this.$router.push('/entities')` |
| Submit data | `await this.$axios.post('/entity', data)` |
| Use event instead | `@create="showDialog"` |

## Related Skills

- **crud-table-list** - Control which fields show as table columns
- **crud-table-search** - Control which fields are searchable
- **crud-expand-panel** - Display long text in expandable rows
