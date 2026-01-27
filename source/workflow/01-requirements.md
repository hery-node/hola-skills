# Stage 1: Requirements Analysis

## Objective

Extract structured data model components from user requirements:

- **Entities** (core data objects)
- **Relationships** (how entities connect)
- **Primary Keys** (unique identifiers)
- **Roles & Permissions** (who can do what)

## Process

### 1. Identify Core Entities

Look for **nouns** in user requirements that represent:

- Data to be stored
- Things users create/manage
- Objects with their own properties

**Example**:

> "Build an e-commerce platform where customers can browse products, add them to cart, and place orders. Admins manage product categories and inventory."

**Entities Identified**:

- `Customer` - users who purchase
- `Product` - items for sale
- `Category` - product groupings
- `Order` - purchase records
- `OrderItem` - products within an order (junction table)

### 2. Define Relationships

Analyze how entities connect:

| Relationship Type | Pattern                   | Example                                 |
| ----------------- | ------------------------- | --------------------------------------- |
| **One-to-Many**   | One parent, many children | Category → Products, Order → OrderItems |
| **Many-to-One**   | Many children, one parent | Products → Category, OrderItems → Order |
| **One-to-One**    | One-to-one mapping        | User → UserProfile                      |
| **Many-to-Many**  | Requires junction entity  | Products ↔ Tags via ProductTag          |

**Example Relationships**:

```
Category (1) → (Many) Product
Customer (1) → (Many) Order
Order (1) → (Many) OrderItem
Product (1) → (Many) OrderItem
```

### 3. Determine Primary Keys

Choose unique identifiers for each entity:

**Guidelines**:

- Use **natural keys** when available (email, username, SKU)
- Use **composite keys** for junction tables ([product_id, order_id])
- Avoid auto-increment IDs as primary keys (hola uses MongoDB ObjectId internally)
- Primary keys should be **immutable** and **meaningful**

**Examples**:

| Entity    | Primary Key          | Reason                        |
| --------- | -------------------- | ----------------------------- |
| Customer  | email                | Natural unique identifier     |
| Product   | sku                  | Business identifier           |
| Category  | name                 | Simple, unique category names |
| Order     | orderNo              | Generated order number        |
| OrderItem | [orderId, productId] | Composite key for junction    |

### 4. Identify Roles & Permissions

Extract user types and their capabilities:

**Role Patterns**:

- **Public** - Unauthenticated users (browse only)
- **User/Customer** - Standard authenticated users
- **Admin** - Full access to management features
- **Manager** - Limited admin capabilities
- **Custom Roles** - Domain-specific (teacher, student, etc.)

**Example**:

> "Customers can browse and purchase. Admins manage products and categories."

**Roles Identified**:

```javascript
// Roles configuration
{
  public: {
    product: ["read"],      // Browse products
    category: ["read"]      // Browse categories
  },
  customer: {
    order: ["create", "read"],      // Place and view own orders
    product: ["read"],
    category: ["read"]
  },
  admin: {
    product: ["create", "read", "update", "delete"],
    category: ["create", "read", "update", "delete"],
    order: ["read", "update"],      // View all, update status
    customer: ["read"]
  }
}
```

## Workflow Example: Blog Platform

**User Requirement**:

> "Create a blog where authors write posts organized by categories. Readers can comment on posts. Admins moderate everything."

### Step 1: Extract Entities

**Nouns Found**: blog, authors, posts, categories, readers, comments, admins

**Entities**:

- `User` (authors, readers, admins are all users with different roles)
- `Post` (blog articles)
- `Category` (post organization)
- `Comment` (reader feedback)

### Step 2: Define Relationships

```
User (1) → (Many) Post       [author relationship]
User (1) → (Many) Comment    [commenter relationship]
Category (1) → (Many) Post
Post (1) → (Many) Comment
```

**Relationship Matrix**:

| From    | To       | Type        | Field Name | Description                  |
| ------- | -------- | ----------- | ---------- | ---------------------------- |
| Post    | User     | Many-to-One | author     | Post belongs to one author   |
| Post    | Category | Many-to-One | category   | Post belongs to one category |
| Comment | User     | Many-to-One | author     | Comment belongs to one user  |
| Comment | Post     | Many-to-One | post       | Comment belongs to one post  |

### Step 3: Choose Primary Keys

| Entity   | Primary Key             | Reasoning                                   |
| -------- | ----------------------- | ------------------------------------------- |
| User     | email                   | Unique, natural identifier                  |
| Post     | slug                    | URL-friendly unique identifier              |
| Category | name                    | Simple unique name                          |
| Comment  | [post, user, createdAt] | Composite (user can comment multiple times) |

**Note**: For Comment, we could also use a single `_id` (ObjectId) as primary key if users can post multiple comments to the same post. The choice depends on business rules.

### Step 4: Define Roles

| Role       | Permissions                                                     |
| ---------- | --------------------------------------------------------------- |
| **public** | Read posts, Read categories                                     |
| **reader** | Read posts, Create/Read own comments                            |
| **author** | Create/Read/Update/Delete own posts, Read comments on own posts |
| **admin**  | Full access to all entities                                     |

**Roles Config**:

```javascript
{
  public: {
    post: ["read"],
    category: ["read"]
  },
  reader: {
    post: ["read"],
    comment: ["create", "read"],  // Own comments only
    category: ["read"]
  },
  author: {
    post: ["create", "read", "update", "delete"],  // Own posts
    comment: ["read"],
    category: ["read"]
  },
  admin: {
    post: ["create", "read", "update", "delete"],
    comment: ["read", "update", "delete"],
    category: ["create", "read", "update", "delete"],
    user: ["read", "update"]
  }
}
```

## Output Template

After requirements analysis, document your findings:

```markdown
## Entities

1. **EntityName** (primary_key: field_name)
   - Description
   - Key attributes
   - Relationships

## Relationships

- Entity1 (1) → (Many) Entity2 via field_name
- Entity2 (Many) → (1) Entity3 via field_name

## Primary Keys

| Entity | Primary Key | Type |
| ------ | ----------- | ---- |
| ...    | ...         | ...  |

## Roles & Permissions

| Role | Entity | Permissions |
| ---- | ------ | ----------- |
| ...  | ...    | ...         |
```

## Common Patterns

### E-Commerce

**Entities**: Customer, Product, Category, Order, OrderItem, Review **Key Relationships**: Category→Product, Customer→Order, Order→OrderItem, Product→Review

### CRM

**Entities**: Contact, Company, Deal, Activity, User **Key Relationships**: Company→Contact, User→Deal, Deal→Activity

### Project Management

**Entities**: User, Project, Task, Comment, Attachment **Key Relationships**: Project→Task, User→Task (assignee), Task→Comment

### Learning Platform

**Entities**: Student, Course, Lesson, Enrollment, Assignment **Key Relationships**: Course→Lesson, Student→Enrollment, Lesson→Assignment

## Checklist

Before proceeding to Stage 2 (Data Model Design):

- [ ] All core entities identified
- [ ] Relationships mapped with cardinality (1-to-1, 1-to-many, many-to-many)
- [ ] Primary keys chosen for each entity
- [ ] Roles identified with permission matrix
- [ ] No redundant entities (proper normalization)
- [ ] Junction entities created for many-to-many relationships

## Next Step

Proceed to **[02-data-model.md](02-data-model.md)** to design the detailed metadata schemas with field types and visibility.
