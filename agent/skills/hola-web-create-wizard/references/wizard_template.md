# Wizard View Template

Complete template for a multi-step create wizard.

## Script Section

```typescript
<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { axiosPost, isSuccessResponse } from 'hola-web';

const { t } = useI18n();
const router = useRouter();

// Wizard state
const step = ref(1);
const loading = ref(false);

// Snackbar
const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

// Form data interface - match your entity fields
interface WizardFormData {
  name: string;
  description: string;
  type: number;
  // ... add more fields
}

// Form data
const form = ref<WizardFormData>({
  name: '',
  description: '',
  type: 0,
});

// Options as computed for i18n
const typeOptions = computed(() => [
  { value: -1, label: t('entity.agent_decides'), icon: 'mdi-robot-outline' },
  { value: 0, label: t('type.option_a'), icon: 'mdi-icon-a' },
  { value: 1, label: t('type.option_b'), icon: 'mdi-icon-b' },
]);

// Total steps
const totalSteps = 3;

// Step labels for stepper
const stepLabels = computed(() => [
  t('entity.wizard_step_1'),
  t('entity.wizard_step_2'),
  t('entity.wizard_step_3'),
]);

// Validation per step
const canProceed = computed(() => {
  switch (step.value) {
    case 1: return form.value.name.trim().length >= 2;
    case 2: return true;
    case 3: return true;
    default: return true;
  }
});

// Navigation
const nextStep = () => { if (step.value < totalSteps) step.value++; };
const prevStep = () => { if (step.value > 1) step.value--; };
const goBack = () => { router.push('/entities'); };

const showSnackbar = (text: string, color = 'success') => {
  snackbarText.value = text;
  snackbarColor.value = color;
  snackbar.value = true;
};

const submit = async () => {
  loading.value = true;
  try {
    const response = await axiosPost<{ code: number; err?: string }>('/entity', { ...form.value });
    if (isSuccessResponse(response.code)) {
      showSnackbar(t('common.save') + ' - OK');
      router.push('/entities');
    } else {
      showSnackbar(response.err || 'Failed to create', 'error');
    }
  } catch (e) {
    showSnackbar('Failed to create', 'error');
  } finally {
    loading.value = false;
  }
};
</script>
```

## Template Section

```vue
<template>
  <v-container fluid class="pa-6">
    <h-bread></h-bread>

    <!-- Header -->
    <v-row class="mb-4">
      <v-col>
        <h1 class="text-h6 font-weight-bold">
          <v-icon class="mr-2">mdi-plus-circle</v-icon>
          {{ t('entity.wizard_title') }}
        </h1>
      </v-col>
    </v-row>

    <!-- Progress indicator -->
    <v-stepper :model-value="step" class="mb-6 elevation-0" alt-labels>
      <v-stepper-header>
        <template v-for="(label, index) in stepLabels" :key="index">
          <v-stepper-item
            :complete="step > index + 1"
            :value="index + 1"
            :title="label"
            :color="step >= index + 1 ? 'primary' : 'grey'"
          />
          <v-divider v-if="index < stepLabels.length - 1" />
        </template>
      </v-stepper-header>
    </v-stepper>

    <!-- Step 1 -->
    <v-card v-if="step === 1" class="pa-6">
      <v-card-title class="text-h6 px-0">{{ stepLabels[0] }}</v-card-title>
      <v-card-text class="px-0">
        <v-text-field v-model="form.name" :label="t('entity.name')" variant="outlined" autofocus />
        <v-textarea v-model="form.description" :label="t('entity.description')" variant="outlined" rows="3" />
      </v-card-text>
      <v-card-actions class="px-0 pt-4">
        <v-btn variant="text" @click="goBack">
          <v-icon start>mdi-arrow-left</v-icon>{{ t('common.back') }}
        </v-btn>
        <v-spacer />
        <v-btn color="primary" variant="elevated" :disabled="!canProceed" @click="nextStep">
          {{ t('common.next') }}<v-icon end>mdi-arrow-right</v-icon>
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Step 2: Card Selection -->
    <v-card v-else-if="step === 2" class="pa-6">
      <v-card-title class="text-h6 px-0">{{ stepLabels[1] }}</v-card-title>
      <v-card-text class="px-0">
        <v-row>
          <v-col v-for="opt in typeOptions" :key="opt.value" cols="4">
            <v-card
              :variant="form.type === opt.value ? 'tonal' : 'outlined'"
              :color="form.type === opt.value ? 'primary' : ''"
              class="pa-3 cursor-pointer text-center"
              @click="form.type = opt.value"
            >
              <v-icon size="32">{{ opt.icon }}</v-icon>
              <div class="text-body-2 mt-1">{{ opt.label }}</div>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions class="px-0 pt-4">
        <v-btn variant="text" @click="prevStep">
          <v-icon start>mdi-arrow-left</v-icon>{{ t('common.back') }}
        </v-btn>
        <v-spacer />
        <v-btn color="primary" variant="elevated" :disabled="!canProceed" @click="nextStep">
          {{ t('common.next') }}<v-icon end>mdi-arrow-right</v-icon>
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Final Step -->
    <v-card v-else-if="step === 3" class="pa-6">
      <v-card-title class="text-h6 px-0">{{ stepLabels[2] }}</v-card-title>
      <v-card-text class="px-0">
        <!-- Add final step content -->
      </v-card-text>
      <v-card-actions class="px-0 pt-4">
        <v-btn variant="text" @click="prevStep">
          <v-icon start>mdi-arrow-left</v-icon>{{ t('common.back') }}
        </v-btn>
        <v-spacer />
        <v-btn color="primary" variant="elevated" size="large" :disabled="!canProceed" :loading="loading" @click="submit">
          <v-icon start>mdi-content-save</v-icon>{{ t('common.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<style scoped>
.cursor-pointer { cursor: pointer; }
</style>
```
