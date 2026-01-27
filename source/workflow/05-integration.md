# Stage 5: Integration & Testing

## Objective

Wire server and client together, then write comprehensive Cypress tests:

- Set up server entry point with MongoDB connection
- Configure web client entry point
- Write Cypress E2E tests for all scenarios
- Test CRUD operations, validation, roles, and workflows

## Server Setup

### Entry Point Configuration

> **IMPORTANT**: Custom types and schema types must be registered **BEFORE** importing router files. Use dynamic imports after type registration.

```typescript
// server/src/main.ts
import { Elysia } from "elysia";
import { plugins, init_db, validate_all_metas } from "hola-server";
import { settings } from "./setting.js";
import { register_types } from "./core/type.js";

const PORT = process.env.PORT || 3000;

async function main() {
  // 1. Initialize database connection
  await init_db(settings.db);
  console.log(`Connected to MongoDB: ${settings.db.name}`);

  // 2. Register custom types BEFORE importing routers
  register_types();

  // 3. Dynamic import routers AFTER types are registered
  const productRouter = (await import("./router/product.js")).default;
  const categoryRouter = (await import("./router/category.js")).default;
  const customerRouter = (await import("./router/customer.js")).default;
  const orderRouter = (await import("./router/order.js")).default;

  // 4. Validate all metas (optional but recommended)
  validate_all_metas();

  // 5. Build the Elysia app
  const app = new Elysia()
    // CORS configuration
    .use(plugins.holaCors({ origin: settings.server.client_web_url }))
    // Body parsing with size limit
    .use(plugins.holaBody({ limit: "10mb" }))
    // JWT Authentication
    .use(
      plugins.holaAuth({
        secret: settings.server.session.secret,
        accessExpiry: "15m",
        refreshExpiry: "7d",
        excludeUrls: settings.server.exclude_urls,
      }),
    )
    // Error handling
    .use(plugins.holaError())
    // Entity routers
    .use(productRouter)
    .use(categoryRouter)
    .use(customerRouter)
    .use(orderRouter)
    // Start server
    .listen(PORT);

  console.log(`Server running on http://localhost:${PORT}`);
}

main().catch(console.error);
```

### Settings Configuration

```typescript
// server/src/setting.ts
export const settings = {
  db: {
    url: process.env.MONGO_URL || "mongodb://localhost:27017",
    name: process.env.DB_NAME || "myapp_dev",
  },
  server: {
    client_web_url: process.env.CLIENT_URL || "http://localhost:5173",
    exclude_urls: ["/customer/login", "/customer/register", "/product/list", "/category/list"],
    session: {
      secret: process.env.JWT_SECRET || "change-me-in-production",
      cookie_max_age: 24 * 60 * 60 * 1000, // 24 hours
    },
  },
};
```

### Custom Types Registration

```typescript
// server/src/core/type.ts
import { register_type, int_enum_type, register_schema_type } from "hola-server";
import { t } from "elysia";

export function register_types() {
  // Product status enum
  register_type(int_enum_type("product_status", [0, 1, 2, 3]));
  register_schema_type("product_status", () => t.Union([t.Literal(0), t.Literal(1), t.Literal(2), t.Literal(3)]));

  // Order status enum
  register_type(int_enum_type("order_status", [0, 1, 2, 3, 4]));
  register_schema_type("order_status", () => t.Union([t.Literal(0), t.Literal(1), t.Literal(2), t.Literal(3), t.Literal(4)]));
}
```

### Environment Configuration

```bash
# server/.env
MONGO_URL=mongodb://localhost:27017
DB_NAME=myapp_dev
JWT_SECRET=change-me-in-production
CLIENT_URL=http://localhost:5173
PORT=3000
NODE_ENV=development
```

### Package.json Scripts

```json
{
  "name": "myapp-server",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/main.ts",
    "build": "tsc",
    "start": "node dist/main.js",
    "test": "vitest"
  },
  "dependencies": {
    "elysia": "^1.0.0",
    "mongodb": "^6.0.0",
    "hola-server": "file:../../hola-server"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.0.0",
    "vitest": "^1.0.0"
  }
}
```

## Web Client Setup

### Entry Point Configuration

```typescript
// web/src/main.ts
import { createApp } from "vue";
import { createVuetify } from "vuetify";
import { createI18n } from "vue-i18n";
import App from "./App.vue";
import router from "./router";
import { setup_components } from "@/components";

import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";

// Vuetify setup
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
          info: "#2196F3",
          success: "#4CAF50",
          warning: "#FFC107",
        },
      },
    },
  },
});

// i18n setup
const i18n = createI18n({
  legacy: false,
  locale: "en",
  fallbackLocale: "en",
  messages: {
    en: {}, // Load from locales/en.json
  },
});

// Create Vue app
const app = createApp(App);

// Register hola-web components
setup_components(app);

// Use plugins
app.use(router);
app.use(vuetify);
app.use(i18n);

// Mount app
app.mount("#app");
```

### API Configuration

```typescript
// web/src/core/api.ts
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000/api";

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // Important for session cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);
```

### Environment Configuration

```bash
# web/.env.development
VITE_API_BASE=http://localhost:3000/api

# web/.env.production
VITE_API_BASE=/api
```

## Cypress Testing

### Cypress Setup

```bash
# Install Cypress
cd web
npm install -D cypress @cypress/vue @testing-library/cypress

# Open Cypress
npx cypress open
```

### Cypress Configuration

```javascript
// web/cypress.config.ts
import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:8080",
    specPattern: "cypress/e2e/**/*.cy.{js,ts}",
    supportFile: "cypress/support/e2e.ts",
    video: false,
    screenshotOnRunFailure: true,
  },
  env: {
    apiUrl: "http://localhost:3000/api",
  },
});
```

### Test Support Commands

```typescript
// web/cypress/support/commands.ts
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      logout(): Chainable<void>;
      createEntity(entity: string, data: any): Chainable<any>;
      deleteEntity(entity: string, id: string): Chainable<void>;
    }
  }
}

Cypress.Commands.add("login", (email: string, password: string) => {
  cy.request({
    method: "POST",
    url: `${Cypress.env("apiUrl")}/auth/login`,
    body: { email, password },
  }).then((response) => {
    expect(response.status).to.eq(200);
    window.sessionStorage.setItem("user", JSON.stringify(response.body.user));
  });
});

Cypress.Commands.add("logout", () => {
  cy.request({
    method: "POST",
    url: `${Cypress.env("apiUrl")}/auth/logout`,
  });
  window.sessionStorage.removeItem("user");
});

Cypress.Commands.add("createEntity", (entity: string, data: any) => {
  return cy
    .request({
      method: "POST",
      url: `${Cypress.env("apiUrl")}/${entity}`,
      body: data,
    })
    .then((response) => response.body);
});

Cypress.Commands.add("deleteEntity", (entity: string, id: string) => {
  cy.request({
    method: "DELETE",
    url: `${Cypress.env("apiUrl")}/${entity}/${id}`,
  });
});

export {};
```

### Test Scenarios

#### 1. CRUD Operations Test

```typescript
// web/cypress/e2e/product-crud.cy.ts
describe("Product CRUD Operations", () => {
  beforeEach(() => {
    cy.login("admin@test.com", "admin123");
    cy.visit("/products");
  });

  it("should create a new product", () => {
    // Click create button
    cy.contains("button", "Create").click();

    // Fill form
    cy.get('input[name="sku"]').type("TEST-001");
    cy.get('input[name="name"]').type("Test Product");
    cy.get('input[name="price"]').type("99.99");
    cy.get('input[name="stock"]').type("100");

    // Select category
    cy.get('[data-test="category-select"]').click();
    cy.contains(".v-list-item", "Electronics").click();

    // Submit form
    cy.contains("button", "Save").click();

    // Verify product appears in table
    cy.contains("td", "TEST-001").should("be.visible");
    cy.contains("td", "Test Product").should("be.visible");
  });

  it("should update an existing product", () => {
    // Find and click edit button
    cy.contains("tr", "TEST-001").find('[data-test="edit-button"]').click();

    // Update fields
    cy.get('input[name="price"]').clear().type("89.99");
    cy.get('input[name="stock"]').clear().type("150");

    // Submit
    cy.contains("button", "Save").click();

    // Verify updates
    cy.contains("tr", "TEST-001").should("contain", "$89.99").and("contain", "150");
  });

  it("should delete a product", () => {
    // Click delete button
    cy.contains("tr", "TEST-001").find('[data-test="delete-button"]').click();

    // Confirm deletion
    cy.contains("button", "Confirm").click();

    // Verify product removed
    cy.contains("td", "TEST-001").should("not.exist");
  });

  afterEach(() => {
    cy.logout();
  });
});
```

#### 2. Search & Filter Test

```typescript
// web/cypress/e2e/product-search.cy.ts
describe("Product Search & Filter", () => {
  beforeEach(() => {
    cy.login("admin@test.com", "admin123");
    cy.visit("/products");
  });

  it("should search by product name", () => {
    // Open search form
    cy.get('[data-test="search-button"]').click();

    // Enter search term
    cy.get('input[name="name"]').type("Laptop");

    // Submit search
    cy.get('[data-test="search-submit"]').click();

    // Verify results
    cy.get("table tbody tr").each(($row) => {
      cy.wrap($row).should("contain", "Laptop");
    });
  });

  it("should filter by category", () => {
    cy.get('[data-test="search-button"]').click();

    // Select category
    cy.get('[data-test="category-filter"]').click();
    cy.contains(".v-list-item", "Electronics").click();

    cy.get('[data-test="search-submit"]').click();

    // Verify all results are in Electronics category
    cy.get("table tbody tr").should("have.length.greaterThan", 0);
  });

  it("should filter by price range", () => {
    cy.get('[data-test="search-button"]').click();

    cy.get('input[name="priceMin"]').type("100");
    cy.get('input[name="priceMax"]').type("500");

    cy.get('[data-test="search-submit"]').click();

    // Verify price range
    cy.get("table tbody tr").each(($row) => {
      cy.wrap($row)
        .find('[data-test="price-cell"]')
        .then(($cell) => {
          const price = parseFloat($cell.text().replace("$", ""));
          expect(price).to.be.at.least(100).and.at.most(500);
        });
    });
  });
});
```

#### 3. Validation Test

```typescript
// web/cypress/e2e/product-validation.cy.ts
describe("Product Validation", () => {
  beforeEach(() => {
    cy.login("admin@test.com", "admin123");
    cy.visit("/products");
    cy.contains("button", "Create").click();
  });

  it("should show required field errors", () => {
    // Try to submit without filling required fields
    cy.contains("button", "Save").click();

    // Verify error messages
    cy.contains("SKU is required").should("be.visible");
    cy.contains("Name is required").should("be.visible");
    cy.contains("Price is required").should("be.visible");
  });

  it("should validate price is positive", () => {
    cy.get('input[name="sku"]').type("TEST-002");
    cy.get('input[name="name"]').type("Test Product");
    cy.get('input[name="price"]').type("-10");

    cy.contains("button", "Save").click();

    cy.contains("Price must be positive").should("be.visible");
  });

  it("should prevent duplicate SKU", () => {
    // Create first product
    cy.get('input[name="sku"]').type("DUP-001");
    cy.get('input[name="name"]').type("First Product");
    cy.get('input[name="price"]').type("50");
    cy.contains("button", "Save").click();

    // Try to create duplicate
    cy.contains("button", "Create").click();
    cy.get('input[name="sku"]').type("DUP-001");
    cy.get('input[name="name"]').type("Duplicate Product");
    cy.get('input[name="price"]').type("60");
    cy.contains("button", "Save").click();

    // Verify error
    cy.contains("SKU already exists").should("be.visible");
  });
});
```

#### 4. Role-Based Access Test

```typescript
// web/cypress/e2e/role-access.cy.ts
describe("Role-Based Access Control", () => {
  it("admin should have full access", () => {
    cy.login("admin@test.com", "admin123");
    cy.visit("/products");

    // Verify all buttons visible
    cy.get('[data-test="create-button"]').should("be.visible");
    cy.get('[data-test="edit-button"]').should("be.visible");
    cy.get('[data-test="delete-button"]').should("be.visible");

    cy.logout();
  });

  it("customer should have read-only access", () => {
    cy.login("customer@test.com", "customer123");
    cy.visit("/products");

    // Verify limited access
    cy.get('[data-test="create-button"]').should("not.exist");
    cy.get('[data-test="edit-button"]').should("not.exist");
    cy.get('[data-test="delete-button"]').should("not.exist");

    // But can view products
    cy.get("table tbody tr").should("have.length.greaterThan", 0);

    cy.logout();
  });

  it("should redirect unauthenticated users", () => {
    cy.visit("/admin/dashboard");

    // Should redirect to login
    cy.url().should("include", "/login");
  });
});
```

#### 5. Workflow Test (Order Processing)

```typescript
// web/cypress/e2e/order-workflow.cy.ts
describe("Order Processing Workflow", () => {
  let orderId: string;

  beforeEach(() => {
    cy.login("admin@test.com", "admin123");
  });

  it("should create an order", () => {
    cy.visit("/orders");
    cy.contains("button", "Create").click();

    // Fill order details
    cy.get('[data-test="customer-select"]').click();
    cy.contains(".v-list-item", "John Doe").click();

    // Add items
    cy.get('[data-test="add-item-button"]').click();
    cy.get('[data-test="product-select"]').click();
    cy.contains(".v-list-item", "Laptop").click();
    cy.get('input[name="quantity"]').type("2");

    cy.contains("button", "Save").click();

    // Capture order ID
    cy.get('[data-test="order-no"]')
      .invoke("text")
      .then((text) => {
        orderId = text;
      });
  });

  it("should update order status to confirmed", () => {
    cy.visit("/orders");

    cy.contains("tr", orderId).find('[data-test="edit-button"]').click();

    cy.get('[data-test="status-select"]').click();
    cy.contains(".v-list-item", "Confirmed").click();

    cy.contains("button", "Save").click();

    // Verify status update
    cy.contains("tr", orderId).should("contain", "Confirmed");
  });

  it("should update order status to shipped", () => {
    cy.visit("/orders");

    cy.contains("tr", orderId).find('[data-test="edit-button"]').click();

    cy.get('[data-test="status-select"]').click();
    cy.contains(".v-list-item", "Shipped").click();

    cy.contains("button", "Save").click();

    // Verify shipped timestamp set
    cy.contains("tr", orderId).find('[data-test="shipped-date"]').should("not.be.empty");
  });

  afterEach(() => {
    cy.logout();
  });
});
```

### Test Database Setup

```typescript
// web/cypress/support/e2e.ts
import "./commands";

// Reset test database before all tests
before(() => {
  cy.request("POST", `${Cypress.env("apiUrl")}/test/reset-db`);
  cy.request("POST", `${Cypress.env("apiUrl")}/test/seed-data`);
});

// Clean up after tests
after(() => {
  cy.request("POST", `${Cypress.env("apiUrl")}/test/cleanup`);
});
```

### Server Test Endpoints

```typescript
// server/router/test.ts (only in development/test)
import { Router } from "express";
import { get_db } from "hola-server";

const router = Router();

// Only enable in test environment
if (process.env.NODE_ENV === "test") {
  router.post("/reset-db", async (req, res) => {
    const db = get_db();
    const collections = await db.listCollections().toArray();

    for (const collection of collections) {
      await db.collection(collection.name).deleteMany({});
    }

    res.json({ code: 1, msg: "Database reset" });
  });

  router.post("/seed-data", async (req, res) => {
    const db = get_db();

    // Insert test data
    await db.collection("user").insertMany([
      { email: "admin@test.com", password: "...", role: "admin" },
      { email: "customer@test.com", password: "...", role: "customer" },
    ]);

    await db.collection("category").insertMany([{ name: "Electronics" }, { name: "Books" }]);

    res.json({ code: 1, msg: "Test data seeded" });
  });
}

export default router;
```

## Package Scripts

```json
// web/package.json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "cypress run",
    "test:open": "cypress open",
    "test:headed": "cypress run --headed",
    "test:chrome": "cypress run --browser chrome"
  }
}
```

## Running Tests

```bash
# Start server (in development mode with test endpoints)
cd server
NODE_ENV=test npm run dev

# Start web client
cd web
npm run dev

# Run Cypress tests (headless)
npm run test

# Run Cypress tests (interactive)
npm run test:open
```

## Test Coverage Checklist

Ensure tests cover:

- [ ] **CRUD Operations**: Create, Read, Update, Delete for all entities
- [ ] **Search & Filter**: All search fields and filters work
- [ ] **Validation**: Required fields, format validation, business rules
- [ ] **Authentication**: Login, logout, session persistence
- [ ] **Authorization**: Role-based access control for all operations
- [ ] **Workflows**: Multi-step processes (order checkout, approval flows)
- [ ] **References**: Entity relationships work correctly
- [ ] **Edge Cases**: Empty states, error handling, concurrent operations
- [ ] **Performance**: Large datasets, pagination, infinite scroll

## Deployment

```bash
# Build client
cd web
npm run build

# Build server
cd server
npm run build

# Deploy (example using Docker)
docker-compose up -d
```

## Complete!

Your Hola meta-programming application is now:

- ✅ Fully implemented (server + client)
- ✅ Tested with Cypress E2E tests
- ✅ Ready for deployment

For ongoing maintenance, refer to the **[reference documentation](../reference/)** for detailed API references and patterns.
