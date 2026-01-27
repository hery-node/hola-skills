# Hola Meta-Programming Framework - AI Skills Guide

## Overview

This skills guide teaches AI assistants (Claude Code, OpenAI Codex, Google Gemini, etc.) how to convert user requirements into complete Hola meta-programming applications. The Hola framework enables rapid development of data-driven applications through declarative metadata definitions.

**Target Use Case**: End-to-end project generation from user requirements → working application (server + web client)

## Quick Start

When a user asks you to build an application using Hola framework:

1. **Analyze Requirements** → Extract entities, relationships, roles ([workflow/01-requirements.md](workflow/01-requirements.md))
2. **Design Data Model** → Plan metadata schemas with field visibility ([workflow/02-data-model.md](workflow/02-data-model.md))
3. **Implement Server** → Create routers, use built-in methods first ([workflow/03-server.md](workflow/03-server.md))
4. **Build Client UI** → Leverage h-crud component, custom views when needed ([workflow/04-client.md](workflow/04-client.md))
5. **Integrate & Test** → Wire components, write Cypress tests ([workflow/05-integration.md](workflow/05-integration.md))

## Documentation Structure

### Workflow Guides (Sequential)

Follow these in order when building a new application:

- **[01-requirements.md](workflow/01-requirements.md)** - How to extract entities from user requirements
- **[02-data-model.md](workflow/02-data-model.md)** - How to design metadata schemas with type reuse
- **[03-server.md](workflow/03-server.md)** - How to implement routers with built-in methods
- **[04-client.md](workflow/04-client.md)** - How to build UI with h-crud and custom views
- **[05-integration.md](workflow/05-integration.md)** - How to integrate and test with Cypress

### Reference Documentation (Lookup)

Use these for detailed technical reference:

- **[meta-api.md](reference/meta-api.md)** - Complete meta/field attributes reference
- **[ui-components.md](reference/ui-components.md)** - UI components catalog with props
- **[patterns.md](reference/patterns.md)** - Common application patterns (e-commerce, blog, CRM)
- **[anti-patterns.md](reference/anti-patterns.md)** - Common mistakes and how to avoid them

## Core Principles

### 1. Reuse Over Reinvention

- **Type System**: Use hola's built-in types (string, number, email, phone, date, etc.) before creating custom types
- **Methods**: Use entity methods (find, create, update) before implementing hooks
- **Components**: Use h-crud component before building custom Vue views
- **Validation**: Use hola's validation framework before custom validators

### 2. Metadata-Driven Development

- **Server**: Define metadata with `init_router()` → automatic REST API + validation
- **Client**: Metadata automatically converted to forms, tables, searches
- **No Boilerplate**: Field visibility (create, list, search, update) configured once

### 3. Convention Over Configuration

- Follow hola's file structure conventions
- Use standard naming patterns
- Leverage automatic behaviors (createdAt, updatedAt, role checks)

## Typical Application Flow

```
User Requirement
    ↓
Requirements Analysis (Extract: entities, relationships, roles)
    ↓
Data Model Design (Define: fields, types, visibility, views)
    ↓
Server Implementation
    ├─ Create routers with init_router()
    ├─ Set operation flags (creatable, readable, etc.)
    ├─ Use entity.find/create/update methods
    └─ Add hooks only when needed
    ↓
Client Implementation
    ├─ Use h-crud for standard CRUD
    ├─ Configure modes, views, headers
    └─ Create custom Vue views if needed
    ↓
Integration & Testing
    ├─ Wire server + client
    ├─ Write Cypress E2E tests
    └─ Test all scenarios (CRUD, roles, validation)
    ↓
Working Application
```

## Example: Simple Task Manager

**User Requirement**: "Build a task manager where users can create, assign, and track tasks"

**Step 1 - Entities Identified**:

- `User` (email, name, role)
- `Task` (title, description, status, assignee, dueDate)

**Step 2 - Data Model**:

```javascript
// server/router/task.ts
import { init_router } from "hola-server";

export default init_router({
  collection: "task",
  primary_keys: ["title"],
  fields: [
    { name: "title", type: "string", required: true },
    { name: "description", type: "string", create: true, update: true, list: false },
    { name: "status", type: "task_status", required: true, default: 0 },
    { name: "assignee", type: "string", ref: "user", delete: "keep" },
    { name: "dueDate", type: "date", search: true, list: true },
  ],
  creatable: true,
  readable: true,
  updatable: true,
  deleteable: true,
});
```

**Step 3 - Client View**:

```vue
<!-- web/src/views/TaskView.vue -->
<template>
  <h-crud entity="task" mode="crudsp" :sortKey="['dueDate']" :sortDesc="[false]" itemLabelKey="title" />
</template>
```

**Result**: Full CRUD task manager with search, pagination, role checks, validation, automatic timestamps.

## When to Read What

| You Need To...                     | Read This                                         |
| ---------------------------------- | ------------------------------------------------- |
| Understand overall workflow        | This README                                       |
| Extract entities from user stories | [01-requirements.md](workflow/01-requirements.md) |
| Decide field types and visibility  | [02-data-model.md](workflow/02-data-model.md)     |
| Implement server logic             | [03-server.md](workflow/03-server.md)             |
| Build UI components                | [04-client.md](workflow/04-client.md)             |
| Set up testing                     | [05-integration.md](workflow/05-integration.md)   |
| Look up meta attributes            | [meta-api.md](reference/meta-api.md)              |
| Find UI component props            | [ui-components.md](reference/ui-components.md)    |
| See example patterns               | [patterns.md](reference/patterns.md)              |
| Avoid common errors                | [anti-patterns.md](reference/anti-patterns.md)    |

## Key Files to Know

**Server Side**:

- `server/src/main.ts` - Entry point, Elysia app setup, router registration
- `server/router/*.ts` - Entity routers with init_router()
- `server/src/core/type.ts` - Custom type definitions (register BEFORE router imports)
- `server/src/setting.ts` - Server settings (DB, auth, exclude URLs)

**Client Side**:

- `web/src/main.ts` - Entry point, Vue app setup
- `web/src/views/*.vue` - Page views with h-crud or custom components
- `web/src/router/index.ts` - Vue router configuration
- `web/src/locales/*.json` - i18n translations

## Next Steps

Start with **[workflow/01-requirements.md](workflow/01-requirements.md)** to begin converting user requirements into a Hola application.

---

**Note for AI Assistants**: This documentation follows a practical, example-driven approach. When implementing, always check the reference documentation for complete attribute lists and edge cases.
