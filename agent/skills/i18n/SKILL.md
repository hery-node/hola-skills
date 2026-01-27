---
name: i18n
description: Add and manage internationalization (i18n) in the Hola framework. Use when the user asks to translate text, add new languages, fix translations, localize field labels, or configure multi-language support.
---

# Internationalization (i18n)

Add and manage translations for multi-language support in the Hola framework.

## When to Use This Skill

- User asks to **add translations** for a new language
- User wants to **fix or improve translations**
- User needs to **localize field labels** (convert `user_name` → `"Username"`)
- User finds **auto-generated translations** with underscores
- User wants to add **entity-specific translations**
- System shows **missing translation warnings**

## Quick Answer

**The Hola framework auto-generates translations from entity definitions. Your job is to convert them to natural language.**

**Auto-generated (needs fixing):**
```json
{
  "user": {
    "user_name": "User_name",     // ❌ BAD - underscores
    "is_active": "Is_active"      // ❌ BAD - not natural
  }
}
```

**Fixed (natural language):**
```json
{
  "user": {
    "user_name": "Username",      // ✅ GOOD - natural
    "is_active": "Active"         // ✅ GOOD - concise
  }
}
```

## How Hola i18n Works

### 1. Server Auto-Generates Translations

When the **server starts**, it reads entity definitions and auto-generates translation files.

**Server entity definition:**
```javascript
// hola-server/router/user.ts
module.exports = init_router({
  collection: "user",
  fields: [
    { name: "user_name", type: "string" },
    { name: "is_active", type: "boolean" },
    { name: "created_at", type: "date" }
  ]
});
```

**Auto-generated client translation:**
```json
// hola-web/src/locales/en.json (auto-generated)
{
  "user": {
    "_label": "User",
    "user_name": "User_name",     // ← Needs fixing!
    "is_active": "Is_active",     // ← Needs fixing!
    "created_at": "Created_at"    // ← Needs fixing!
  }
}
```

### 2. You Fix the Auto-Generated Translations

**Your task:** Convert underscored names to natural language, especially for **table headers** (keep them concise!).

**Fixed translations:**
```json
{
  "user": {
    "_label": "User",
    "user_name": "Username",      // Concise for table header
    "is_active": "Active",        // One word is best
    "created_at": "Created"       // Short for table
  }
}
```

### 3. Deep Merge on Startup

The framework uses **deep merge** to combine:
1. hola-web default translations (system UI)
2. Auto-generated entity  translations
3. Your custom translations (overrides)

## Step-by-Step Instructions

###Step  1: Locate the Translation File

**Client-side translations:** `hola-web/src/locales/[lang].json`

- `en.json` - English
- `zh.json` - Chinese

**Example:** Open `hola-web/src/locales/en.json`

### Step 2: Find Auto-Generated Translations

Look for **underscored field names** or **improper capitalization**:

```json
{
  "product": {
    "_label": "Product",
    "product_name": "Product_name",      // ← FIX THIS
    "unit_price": "Unit_price",          // ← FIX THIS
    "is_available": "Is_available",      // ← FIX THIS
    "stock_quantity": "Stock_quantity"   // ← FIX THIS
  }
}
```

### Step 3: Fix to Natural Language

**Rules:**
1. **Remove underscores**, use proper spacing
2. **Use concise labels** (1-2 words) for table headers
3. **Use title case** (capitalize first letter of each word)
4. **Be descriptive** but not verbose

**Before → After:**

| Before (Auto) | After (Fixed) | Notes |
|---------------|---------------|-------|
| `user_name` | `Username` | One word is best |
| `is_active` | `Active` | Remove "is_" prefix |
| `created_at` | `Created` | Short for tables |
| `phone_number` | `Phone` | Shorter for tables |
| `email_address` | `Email` | Common understanding |
| `product_description` | `Description` | Context is clear |
| `unit_price` | `Price` | Simpler is better |

**Fixed example:**
```json
{
  "product": {
    "_label": "Product",
    "product_name": "Name",         // Short & clear
    "unit_price": "Price",          // Concise
    "is_available": "Available",    // Natural
    "stock_quantity": "Stock"       // Table-friendly
  }
}
```

### Step 4: Handle Duplicate Keys with Deep Merge

If you have **custom translations** that overlap with system translations, use **deep merge** to combine them properly.

**Problem:** Shallow merge loses nested keys

```javascript
// ❌ BAD - Shallow merge (loses type.boolean_true)
const messages = {
  en: {
    ...holaEnMessages,  // Has type.boolean_true
    ...appMessages      // Replaces entire "type" object!
  }
};
```

**Solution:** Use deep merge

```javascript
// ✅ GOOD - Deep merge preserves nested keys
import { deepMerge } from "hola-web";

const messages = {
  en: deepMerge(holaEnMessages, appMessages)
};
```

### Step 5: Restart the Server

Translation changes require server restart:

```bash
# In hola-server directory
bun run dev
```

## Translation Structure

### Entity-Specific Translations

Each entity gets its own section:

```json
{
  "user": {
    "_label": "User",              // Entity display name
    "name": "Username",            // Field labels
    "name_hint": "Enter username", // Field hints
    "email": "Email",
    "email_hint": "Enter your email"
  },
  "product": {
    "_label": "Product",
    "name": "Product Name",
    "name_hint": "Enter product name",
    "price": "Price",
    "price_hint": "Price in USD"
  }
}
```

### System Translations (Pre-defined)

System translations are in hola-web's built-in locale files:

```json
{
  "form": {
    "create_title": "Create {entity}",
    "update_title": "Update {entity}",
    "submit_label": "Submit",
    "cancel_label": "Cancel"
  },
  "table": {
    "action_header": "Actions",
    "no_data": "No data available",
    "delete_confirm": "Are you sure you want to delete this {entity}?"
  },
  "type": {
    "boolean_true": "Yes",
    "boolean_false": "No",
    "email": "{field} must be a valid email address."
  }
}
```

## Best Practices

### 1. Keep Table Headers Concise

Table columns have limited width. Use 1-2 words:

```json
// ✅ GOOD - Short for table headers
"user_name": "Username",
"created_at": "Created",
"is_active": "Active",
"phone_number": "Phone"

// ❌ BAD - Too verbose for tables
"user_name": "User Name Field",
"created_at": "Date Created At",
"is_active": "Is Currently Active",
"phone_number": "Phone Number"
```

### 2. Remove Technical Prefixes

Remove technical prefixes like `is_`, `has_`, `can_`:

```json
// ✅ GOOD
"is_active": "Active",
"has_permission": "Permission",
"can_edit": "Editable"

// ❌ BAD
"is_active": "Is Active",
"has_permission": "Has Permission",
"can_edit": "Can Edit"
```

### 3. Use Natural Language

Translate to how humans actually speak:

```json
// ✅ GOOD - Natural
"created_at": "Created",
"updated_at": "Updated",
"deleted_at": "Deleted"

// ❌ BAD - Technical
"created_at": "Created At",
"updated_at": "Updated At",
"deleted_at": "Deleted At"
```

### 4. Be Consistent

Use the same translation for the same concept across all entities:

```json
{
  "user": {
    "created_at": "Created",
    "is_active": "Active"
  },
  "product": {
    "created_at": "Created",     // ← Same as user
    "is_active": "Active"        // ← Same as user
  }
}
```

### 5. Add Hints for Complex Fields

Use `_hint` suffix for field placeholders and help text:

```json
{
  "user": {
    "email": "Email",
    "email_hint": "Enter your work email address",
    "password": "Password",
    "password_hint": "At least 8 characters with numbers and symbols"
  }
}
```

## Common Patterns

### Pattern 1: User/Person Fields

```json
{
  "user": {
    "_label": "User",
    "name": "Name",
    "username": "Username",
    "email": "Email",
    "phone": "Phone",
    "role": "Role",
    "is_active": "Active",
    "created_at": "Joined",      // More natural for users
    "last_login": "Last Login"
  }
}
```

### Pattern 2: Product/Item Fields

```json
{
  "product": {
    "_label": "Product",
    "name": "Name",
    "sku": "SKU",
    "price": "Price",
    "stock": "Stock",
    "category": "Category",
    "is_available": "Available",
    "created_at": "Added",       // More natural for products
    "updated_at": "Updated"
  }
}
```

### Pattern 3: Order/Transaction Fields

```json
{
  "order": {
    "_label": "Order",
    "order_number": "Order #",
    "customer_name": "Customer",
    "total_amount": "Total",
    "status": "Status",
    "payment_method": "Payment",
    "created_at": "Placed",      // More natural for orders
    "shipped_at": "Shipped"
  }
}
```

### Pattern 4: Boolean Fields

```json
{
  "product": {
    "is_active": "Active",
    "is_published": "Published",
    "is_featured": "Featured",
    "is_discounted": "On Sale",
    "is_available": "Available"
  }
}
```

### Pattern 5: Date/Time Fields

```json
{
  "entity": {
    "created_at": "Created",
    "updated_at": "Updated",
    "deleted_at": "Deleted",
    "published_at": "Published",
    "expires_at": "Expires"
  }
}
```

## Adding New Languages

### Step 1: Create New Locale File

Create `[lang].json` in `hola-web/src/locales/`:

```bash
# Example: Add French
touch hola-web/src/locales/fr.json
```

### Step 2: Copy Structure from English

```json
// hola-web/src/locales/fr.json
{
  "user": {
    "_label": "Utilisateur",
    "name": "Nom",
    "email": "Email",
    "is_active": "Actif"
  },
  "form": {
    "submit_label": "Soumettre",
    "cancel_label": "Annuler"
  },
  "table": {
    "no_data": "Aucune donnée disponible"
  }
}
```

### Step 3: Update Main Entry Point

The framework auto-loads all `*.json` files from `locales/` directory using Vite's glob import:

```javascript
// No changes needed - files are auto-loaded!
```

## Troubleshooting

### Problem: Translations still show underscores

**Cause:** Server needs restart or translations not saved

**Solution:**
1. Save the locale file (`en.json` or `zh.json`)
2. Restart server:
```bash
cd hola-server
bun run dev
```

### Problem: Table headers too long

**Cause:** Verbose translations

**Solution:** Use 1-2 word translations:
```json
// Before
"shipping_address": "Shipping Address Information"

// After
"shipping_address": "Address"  // Context is clear
```

### Problem: Missing translations (shows key instead of text)

**Cause:** Translation key not defined

**Solution:** Add the missing key to locale file:
```json
{
  "myEntity": {
    "myField": "My Field Label"
  }
}
```

### Problem: Duplicate keys conflict

**Cause:** Shallow merge instead of deep merge

**Solution:** Use `deepMerge` utility:
```javascript
import { deepMerge } from "hola-web";

const messages = {
  en: deepMerge(holaEnMessages, appMessages)
};
```

## Quick Reference

| Task | Action |
|------|--------|
| Fix auto-gen translations | Edit `hola-web/src/locales/en.json` |
| Add new language | Create `hola-web/src/locales/[lang].json` |
| Add entity label | Add `"_label": "Entity Name"` |
| Add field hint | Add `"field_hint": "Help text"` |
| Remove underscores | `user_name` → `"Username"` |
| Make concise | `created_at` → `"Created"` (not "Created At") |
| Merge translations | Use `deepMerge(base, override)` |

## Translation Checklist

When localizing an entity, check these items:

- [ ] **Entity label** (`_label`) is natural
- [ ] **Field names** have no underscores
- [ ] **Table headers** are concise (1-2 words)
- [ ] **Boolean fields** remove `is_`/`has_` prefix
- [ ] **Date fields** use past tense (`"Created"` not `"Created At"`)
- [ ] **Hints** added for complex fields (`_hint` suffix)
- [ ] **Consistency** with other entities
- [ ] **All languages** updated (en.json, zh.json)

## Example: Complete Entity Localization

**Server entity:**
```javascript
// hola-server/router/product.ts
module.exports = init_router({
  collection: "product",
  fields: [
    { name: "product_name", type: "string", required: true },
    { name: "unit_price", type: "currency" },
    { name: "stock_quantity", type: "int" },
    { name: "is_available", type: "boolean" },
    { name: "created_at", type: "date", sys: true }
  ]
});
```

**Auto-generated (before fixing):**
```json
{
  "product": {
    "_label": "Product",
    "product_name": "Product_name",
    "unit_price": "Unit_price",
    "stock_quantity": "Stock_quantity",
    "is_available": "Is_available",
    "created_at": "Created_at"
  }
}
```

**Fixed (natural language):**
```json
{
  "product": {
    "_label": "Product",
    "product_name": "Name",
    "product_name_hint": "Enter product name",
    "unit_price": "Price",
    "unit_price_hint": "Price in USD",
    "stock_quantity": "Stock",
    "stock_quantity_hint": "Available quantity",
    "is_available": "Available",
    "created_at": "Added"
  }
}
```

**Chinese translation:**
```json
{
  "product": {
    "_label": "产品",
    "product_name": "名称",
    "product_name_hint": "输入产品名称",
    "unit_price": "价格",
    "unit_price_hint": "美元价格",
    "stock_quantity": "库存",
    "stock_quantity_hint": "可用数量",
    "is_available": "可用",
    "created_at": "添加时间"
  }
}
```

**Result:** Clean table with headers: `Name | Price | Stock | Available | Added` instead of `Product_name | Unit_price | Stock_quantity | Is_available | Created_at` ✅

## Related Skills

- **add-meta-type** - Create custom types with i18n support
- **crud-table-list** - Configure which fields show in tables (affects which translations are visible)
- **crud-table-search** - Configure searchable fields (affects which field labels appear in search form)
