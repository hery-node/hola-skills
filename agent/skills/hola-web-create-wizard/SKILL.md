---
name: hola-web-create-wizard
description: Create customized create form/wizard for hola-web CRUD views. Use when the default h-crud create dialog needs to be replaced with a full-page multi-step wizard with custom UI, validation, and step-based navigation. Triggers when user wants a guided project/entity creation flow, card-based option selection, or step-by-step form wizard.
---

# Hola Web Create Wizard

Create customized full-page wizards to replace the default h-crud create dialog. Ideal for complex entity creation flows requiring step-based guidance, card-based option selection, and visual feedback.

## When to Use

- Default h-crud create dialog is too simple for the entity
- Multi-step guidance improves user experience
- Options are best presented as clickable cards rather than dropdowns
- User needs visual feedback for complex configuration choices

## Pattern Overview

The create wizard pattern consists of:

1. **h-crud with create-route** - Redirect create action to wizard page
2. **Standalone wizard view** - Full-page multi-step form with v-stepper
3. **Card-based selection** - Clickable v-cards for option selection
4. **i18n labels** - All labels using translation functions

## Implementation Steps

### Step 1: Configure h-crud to Use Create Route

In the list view, configure h-crud to redirect to wizard:

```vue
<h-crud
  ref="crudRef"
  :entity="entity"
  create-route="/entity-wizard"
  mode="crusd"
>
</h-crud>
```

Key points:
- `create-route="/entity-wizard"` - URL to navigate when create button clicked
- `mode="crusd"` - Include 'c' to show create button

### Step 2: Add Route in main.ts

```typescript
import EntityWizardView from "./views/entity/EntityWizardView.vue";

const routes = [
  // ... existing routes
  { path: "/entity-wizard", name: "entity-wizard", component: EntityWizardView },
];
```

### Step 3: Create Wizard View Structure

See [references/wizard_template.md](references/wizard_template.md) for complete template.

Key components:
- **v-stepper** for progress indication
- **v-card** for each step content
- **Computed stepLabels** for i18n step names
- **canProceed validation** per step
- **Form data interface** matching entity fields

### Step 4: Card-Based Option Selection

For enum fields, use clickable cards instead of dropdowns:

```vue
<v-row>
  <v-col v-for="option in options" :key="option.value" cols="4">
    <v-card
      :variant="form.field === option.value ? 'tonal' : 'outlined'"
      :color="form.field === option.value ? 'primary' : ''"
      class="pa-3 cursor-pointer text-center"
      @click="form.field = option.value"
    >
      <v-icon size="32">{{ option.icon }}</v-icon>
      <div class="text-body-2 mt-1">{{ option.label }}</div>
    </v-card>
  </v-col>
</v-row>
```

### Step 5: Multi-Select with Checkbox Cards

For array fields, use checkbox cards:

```vue
<v-col v-for="item in items" :key="item.value" cols="6">
  <v-card
    :variant="form.items.includes(item.value) ? 'tonal' : 'outlined'"
    :color="form.items.includes(item.value) ? 'primary' : ''"
    class="pa-4 cursor-pointer d-flex align-center"
    @click="toggleItem(item.value)"
  >
    <v-checkbox-btn :model-value="form.items.includes(item.value)" />
    <v-icon class="mx-2">{{ item.icon }}</v-icon>
    <div>{{ item.label }}</div>
  </v-card>
</v-col>
```

### Step 6: Add "Agent Decides" Option

For AI-driven applications, add an "Agent Decides" option:

```typescript
const options = computed(() => [
  { value: -1, label: t('entity.agent_decides'), icon: 'mdi-robot-outline' },
  { value: 0, label: t('type.option_a'), icon: 'mdi-icon-a' },
  // ... more options
]);
```

### Step 7: i18n for Labels

All labels should use i18n computed properties:

```typescript
const options = computed(() => [
  { value: 0, label: t('type.my_option'), icon: 'mdi-icon' },
]);
```

Add translations to locale file:
```json
{
  "entity": {
    "wizard_step_name": "Basic Info",
    "wizard_step_type": "Type",
    "agent_decides": "Agent Decides"
  }
}
```

## Sample Implementation

See [references/project_wizard_sample.vue](references/project_wizard_sample.vue) for a complete working example with:
- 6-step wizard (Name → Type → Tech Stack → Platforms → Delivery → Codebase)
- Agent selection with card UI
- Dynamic step count based on project type
- GitHub token conditional fields
- Complete validation per step

## Checklist

- [ ] h-crud configured with `create-route` and `mode="crusd"`
- [ ] Route added to main.ts
- [ ] Wizard view created with v-stepper
- [ ] Form interface matches entity fields
- [ ] Options converted to computed with i18n
- [ ] Card-based selection for enum fields
- [ ] Validation logic per step
- [ ] Submit calls axiosPost to entity endpoint
- [ ] Navigation back to list on success
