<script setup lang="ts">
/**
 * ProjectWizardView - Full-page multi-step wizard for creating new projects
 * Steps: Name → Type → Tech Stack → Platforms → Delivery → Codebase (if refactoring)
 * Pattern follows SkillCreatorView (no dialog, full page)
 */
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { axiosPost, isSuccessResponse } from 'hola-web';
import { PROJECT_TYPE, TECH_STACK, DELIVERY_MODE, CODEBASE_SOURCE } from '@/core/type';

// Extract type values for type annotations
type ProjectTypeValue = typeof PROJECT_TYPE[keyof typeof PROJECT_TYPE];
type TechStackValue = typeof TECH_STACK[keyof typeof TECH_STACK];
type DeliveryModeValue = typeof DELIVERY_MODE[keyof typeof DELIVERY_MODE];
type CodebaseSourceValue = typeof CODEBASE_SOURCE[keyof typeof CODEBASE_SOURCE];

// Form data interface
interface WizardFormData {
  name: string;
  description: string;
  agent: number;
  project_type: ProjectTypeValue;
  tech_stack: TechStackValue;
  platforms: string[];
  delivery_mode: DeliveryModeValue;
  github_repo: string;
  github_token: string;
  codebase_source: CodebaseSourceValue;
  budget: number;
}

const { t } = useI18n();
const router = useRouter();

// Wizard state
const step = ref(1);
const loading = ref(false);

// Snackbar
const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

// Form data with explicit typing
const form = ref<WizardFormData>({
  name: '',
  description: '',
  agent: 0,
  project_type: PROJECT_TYPE.SCRATCH,
  tech_stack: -1,
  platforms: [],
  delivery_mode: DELIVERY_MODE.ZIP,
  github_repo: '',
  github_token: '',
  codebase_source: CODEBASE_SOURCE.NONE,
  budget: 100,
});

// Coding agent options
const agentOptions = computed(() => [
  { value: 0, label: t('type.coding_agent_opencode'), icon: 'mdi-code-braces' },
  { value: 1, label: t('type.coding_agent_claude'), icon: 'mdi-robot' },
  { value: 2, label: t('type.coding_agent_gemini'), icon: 'mdi-google' },
  { value: 3, label: t('type.coding_agent_github'), icon: 'mdi-github' },
]);

// Platform options
const platformOptions = computed(() => [
  { value: 'agent', label: t('project.agent_decides'), icon: 'mdi-robot-outline' },
  { value: 'backend', label: t('project.platform_backend'), icon: 'mdi-server' },
  { value: 'web', label: t('project.platform_web'), icon: 'mdi-web' },
  { value: 'desktop', label: t('project.platform_desktop'), icon: 'mdi-desktop-mac' },
  { value: 'mobile', label: t('project.platform_mobile'), icon: 'mdi-cellphone' },
]);

// Tech stack options with icons
const techStackOptions = computed(() => [
  { value: -1, label: t('project.agent_decides'), icon: 'mdi-robot-outline' },
  { value: TECH_STACK.NODEJS, label: t('type.tech_stack_nodejs'), icon: 'mdi-nodejs' },
  { value: TECH_STACK.BUN, label: t('type.tech_stack_bun'), icon: 'mdi-flash' },
  { value: TECH_STACK.PYTHON, label: t('type.tech_stack_python'), icon: 'mdi-language-python' },
  { value: TECH_STACK.RUST, label: t('type.tech_stack_rust'), icon: 'mdi-cog' },
  { value: TECH_STACK.GO, label: t('type.tech_stack_go'), icon: 'mdi-language-go' },
  { value: TECH_STACK.JAVA, label: t('type.tech_stack_java'), icon: 'mdi-language-java' },
  { value: TECH_STACK.FULL, label: t('type.tech_stack_full'), icon: 'mdi-layers' },
]);

// Computed - total steps based on project type
const totalSteps = computed(() => form.value.project_type === PROJECT_TYPE.REFACTORING ? 6 : 5);
const isRefactoring = computed(() => form.value.project_type === PROJECT_TYPE.REFACTORING);
const isGitHubDelivery = computed(() => form.value.delivery_mode === DELIVERY_MODE.GITHUB);

// Validation
const canProceed = computed(() => {
  switch (step.value) {
    case 1: return form.value.name.trim().length >= 2;
    case 2: return true;
    case 3: return true;
    case 4: return form.value.platforms.length > 0;
    case 5:
      if (isGitHubDelivery.value) {
        return form.value.github_repo.trim().length > 0 && form.value.github_token.trim().length > 0;
      }
      return true;
    case 6: // Codebase step for refactoring
      if (form.value.codebase_source === CODEBASE_SOURCE.GITHUB) {
        return form.value.github_repo.trim().length > 0;
      }
      return form.value.codebase_source !== CODEBASE_SOURCE.NONE || true;
    default: return true;
  }
});

// Step labels
const stepLabels = computed(() => [
  t('project.wizard_step_name'),
  t('project.wizard_step_type'),
  t('project.wizard_step_stack'),
  t('project.wizard_step_platforms'),
  t('project.wizard_step_delivery'),
  ...(isRefactoring.value ? [t('project.wizard_step_codebase')] : [])
]);

// Navigation
const nextStep = () => {
  if (step.value < totalSteps.value) {
    step.value++;
  }
};

const prevStep = () => {
  if (step.value > 1) step.value--;
};

const goBack = () => {
  router.push('/projects');
};

const showSnackbar = (text: string, color = 'success') => {
  snackbarText.value = text;
  snackbarColor.value = color;
  snackbar.value = true;
};

const submit = async () => {
  loading.value = true;
  try {
    const response = await axiosPost<{ code: number; err?: string }>('/project', { ...form.value });
    if (isSuccessResponse(response.code)) {
      showSnackbar(t('common.save') + ' - OK', 'success');
      // Navigate to project list
      router.push('/projects');
    } else {
      showSnackbar(response.err || 'Failed to create project', 'error');
    }
  } catch (e) {
    console.error('Create project failed:', e);
    showSnackbar('Failed to create project', 'error');
  } finally {
    loading.value = false;
  }
};

// Platform toggle
const togglePlatform = (platform: string) => {
  const idx = form.value.platforms.indexOf(platform);
  if (idx >= 0) {
    form.value.platforms.splice(idx, 1);
  } else {
    form.value.platforms.push(platform);
  }
};
</script>

<template>
  <v-container fluid class="pa-6">
    <h-bread></h-bread>

    <!-- Header -->
    <v-row class="mb-4">
      <v-col>
        <h1 class="text-h6 font-weight-bold">
          <v-icon class="mr-2">mdi-folder-plus</v-icon>
          {{ t('project.wizard_title') }}
        </h1>
        <p class="text-body-1 text-medium-emphasis mt-2">
          {{ t('project.wizard_subtitle') }}
        </p>
      </v-col>
    </v-row>

    <!-- Progress indicator -->
    <v-stepper :model-value="step" class="mb-6 elevation-0" alt-labels style="max-width: 100%;">
      <v-stepper-header>
        <template v-for="(label, index) in stepLabels" :key="index">
          <v-stepper-item :complete="step > index + 1" :value="index + 1" :title="label" :color="step >= index + 1 ? 'primary' : 'grey'" />
          <v-divider v-if="index < stepLabels.length - 1" />
        </template>
      </v-stepper-header>
    </v-stepper>

    <!-- Step 1: Name & Description -->
    <v-card v-if="step === 1" class="pa-6" style="max-width: 100%; width: 100%;">
      <v-card-title class="text-h6 px-0">{{ t('project.wizard_step_name') }}</v-card-title>
      <v-card-text class="px-0">
        <div class="text-subtitle-1 mb-4">{{ t('project.wizard_name_subtitle') }}</div>
        <v-text-field v-model="form.name" :label="t('project.name')" variant="outlined" autofocus />
        <v-textarea v-model="form.description" :label="t('project.description')" variant="outlined" rows="3" />
      </v-card-text>
      <v-card-actions class="px-0 pt-4">
        <v-btn variant="text" @click="goBack">
          <v-icon start>mdi-arrow-left</v-icon>
          {{ t('common.back') }}
        </v-btn>
        <v-spacer />
        <v-btn color="primary" variant="elevated" :disabled="!canProceed" @click="nextStep">
          {{ t('common.next') }}
          <v-icon end>mdi-arrow-right</v-icon>
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Step 2: Agent & Project Type -->
    <v-card v-else-if="step === 2" class="pa-6" style="max-width: 100%; width: 100%;">
      <v-card-title class="text-h6 px-0">{{ t('project.wizard_step_type') }}</v-card-title>
      <v-card-text class="px-0">
        <!-- Coding Agent Selection -->
        <div class="text-subtitle-1 mb-4">{{ t('project.wizard_agent_subtitle') }}</div>
        <v-row class="mb-6">
          <v-col v-for="agent in agentOptions" :key="agent.value" cols="3">
            <v-card :variant="form.agent === agent.value ? 'tonal' : 'outlined'" :color="form.agent === agent.value ? 'primary' : ''" class="pa-3 cursor-pointer text-center" @click="form.agent = agent.value">
              <v-icon size="32">{{ agent.icon }}</v-icon>
              <div class="text-body-2 mt-1">{{ agent.label }}</div>
            </v-card>
          </v-col>
        </v-row>

        <!-- Project Type Selection -->
        <div class="text-subtitle-1 mb-4">{{ t('project.wizard_type_subtitle') }}</div>
        <v-row>
          <v-col cols="6">
            <v-card :variant="form.project_type === PROJECT_TYPE.SCRATCH ? 'tonal' : 'outlined'" :color="form.project_type === PROJECT_TYPE.SCRATCH ? 'primary' : ''" class="pa-4 cursor-pointer text-center" @click="form.project_type = PROJECT_TYPE.SCRATCH">
              <v-icon size="48" class="mb-2">mdi-plus-circle</v-icon>
              <div class="text-h6">{{ t('type.project_type_scratch') }}</div>
              <div class="text-caption">Start a new project from scratch</div>
            </v-card>
          </v-col>
          <v-col cols="6">
            <v-card :variant="form.project_type === PROJECT_TYPE.REFACTORING ? 'tonal' : 'outlined'" :color="form.project_type === PROJECT_TYPE.REFACTORING ? 'primary' : ''" class="pa-4 cursor-pointer text-center" @click="form.project_type = PROJECT_TYPE.REFACTORING">
              <v-icon size="48" class="mb-2">mdi-code-braces</v-icon>
              <div class="text-h6">{{ t('type.project_type_refactoring') }}</div>
              <div class="text-caption">Modify an existing codebase</div>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions class="px-0 pt-4">
        <v-btn variant="text" @click="prevStep">
          <v-icon start>mdi-arrow-left</v-icon>
          {{ t('common.back') }}
        </v-btn>
        <v-spacer />
        <v-btn color="primary" variant="elevated" :disabled="!canProceed" @click="nextStep">
          {{ t('common.next') }}
          <v-icon end>mdi-arrow-right</v-icon>
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Step 3: Tech Stack -->
    <v-card v-else-if="step === 3" class="pa-6" style="max-width: 100%; width: 100%;">
      <v-card-title class="text-h6 px-0">{{ t('project.wizard_step_stack') }}</v-card-title>
      <v-card-text class="px-0">
        <div class="text-subtitle-1 mb-4">{{ t('project.wizard_stack_subtitle') }}</div>
        <v-row>
          <v-col v-for="tech in techStackOptions" :key="tech.value" cols="4">
            <v-card :variant="form.tech_stack === tech.value ? 'tonal' : 'outlined'" :color="form.tech_stack === tech.value ? 'primary' : ''" class="pa-3 cursor-pointer text-center" @click="form.tech_stack = tech.value">
              <v-icon size="32">{{ tech.icon }}</v-icon>
              <div class="text-body-2 mt-1">{{ tech.label }}</div>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions class="px-0 pt-4">
        <v-btn variant="text" @click="prevStep">
          <v-icon start>mdi-arrow-left</v-icon>
          {{ t('common.back') }}
        </v-btn>
        <v-spacer />
        <v-btn color="primary" variant="elevated" :disabled="!canProceed" @click="nextStep">
          {{ t('common.next') }}
          <v-icon end>mdi-arrow-right</v-icon>
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Step 4: Platforms -->
    <v-card v-else-if="step === 4" class="pa-6" style="max-width: 100%; width: 100%;">
      <v-card-title class="text-h6 px-0">{{ t('project.wizard_step_platforms') }}</v-card-title>
      <v-card-text class="px-0">
        <div class="text-subtitle-1 mb-4">{{ t('project.wizard_platforms_subtitle') }}</div>
        <v-row>
          <v-col v-for="platform in platformOptions" :key="platform.value" cols="6">
            <v-card :variant="form.platforms.includes(platform.value) ? 'tonal' : 'outlined'" :color="form.platforms.includes(platform.value) ? 'primary' : ''" class="pa-4 cursor-pointer d-flex align-center" @click="togglePlatform(platform.value)">
              <v-checkbox-btn :model-value="form.platforms.includes(platform.value)" @click.stop="togglePlatform(platform.value)" />
              <v-icon class="mx-2">{{ platform.icon }}</v-icon>
              <div>{{ platform.label }}</div>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions class="px-0 pt-4">
        <v-btn variant="text" @click="prevStep">
          <v-icon start>mdi-arrow-left</v-icon>
          {{ t('common.back') }}
        </v-btn>
        <v-spacer />
        <v-btn color="primary" variant="elevated" :disabled="!canProceed" @click="nextStep">
          {{ t('common.next') }}
          <v-icon end>mdi-arrow-right</v-icon>
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Step 5: Delivery Mode -->
    <v-card v-else-if="step === 5" class="pa-6" style="max-width: 100%; width: 100%;">
      <v-card-title class="text-h6 px-0">{{ t('project.wizard_step_delivery') }}</v-card-title>
      <v-card-text class="px-0">
        <div class="text-subtitle-1 mb-4">{{ t('project.wizard_delivery_subtitle') }}</div>
        <v-row>
          <v-col cols="6">
            <v-card :variant="form.delivery_mode === DELIVERY_MODE.ZIP ? 'tonal' : 'outlined'" :color="form.delivery_mode === DELIVERY_MODE.ZIP ? 'primary' : ''" class="pa-4 cursor-pointer text-center" @click="form.delivery_mode = DELIVERY_MODE.ZIP">
              <v-icon size="48" class="mb-2">mdi-folder-zip</v-icon>
              <div class="text-h6">{{ t('type.delivery_mode_zip') }}</div>
              <div class="text-caption">Download as a ZIP file</div>
            </v-card>
          </v-col>
          <v-col cols="6">
            <v-card :variant="form.delivery_mode === DELIVERY_MODE.GITHUB ? 'tonal' : 'outlined'" :color="form.delivery_mode === DELIVERY_MODE.GITHUB ? 'primary' : ''" class="pa-4 cursor-pointer text-center" @click="form.delivery_mode = DELIVERY_MODE.GITHUB">
              <v-icon size="48" class="mb-2">mdi-github</v-icon>
              <div class="text-h6">{{ t('type.delivery_mode_github') }}</div>
              <div class="text-caption">Push to a GitHub repository</div>
            </v-card>
          </v-col>
        </v-row>

        <!-- GitHub fields (conditional) -->
        <v-expand-transition>
          <div v-if="isGitHubDelivery" class="mt-4">
            <v-text-field v-model="form.github_repo" :label="t('project.github_repo')" :hint="t('project.github_repo_hint')" variant="outlined" prepend-inner-icon="mdi-github" placeholder="https://github.com/username/repo" />
            <v-text-field v-model="form.github_token" :label="t('project.github_token')" :hint="t('project.github_token_hint')" variant="outlined" type="password" prepend-inner-icon="mdi-key">
              <template #append-inner>
                <v-tooltip location="top">
                  <template #activator="{ props }">
                    <v-btn v-bind="props" icon="mdi-help-circle-outline" size="small" variant="text" href="https://github.com/settings/tokens/new?scopes=repo&description=HolaCoder" target="_blank" @click.stop />
                  </template>
                  <span>Click to create a GitHub token with repo permissions</span>
                </v-tooltip>
              </template>
            </v-text-field>
          </div>
        </v-expand-transition>
      </v-card-text>
      <v-card-actions class="px-0 pt-4">
        <v-btn variant="text" @click="prevStep">
          <v-icon start>mdi-arrow-left</v-icon>
          {{ t('common.back') }}
        </v-btn>
        <v-spacer />
        <v-btn v-if="!isRefactoring" color="primary" variant="elevated" size="large" :disabled="!canProceed" :loading="loading" @click="submit">
          <v-icon start>mdi-content-save</v-icon>
          {{ t('common.save') }}
        </v-btn>
        <v-btn v-else color="primary" variant="elevated" :disabled="!canProceed" @click="nextStep">
          {{ t('common.next') }}
          <v-icon end>mdi-arrow-right</v-icon>
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Step 6: Codebase Source (Refactoring only) -->
    <v-card v-else-if="step === 6" class="pa-6" style="max-width: 100%; width: 100%;">
      <v-card-title class="text-h6 px-0">{{ t('project.wizard_step_codebase') }}</v-card-title>
      <v-card-text class="px-0">
        <div class="text-subtitle-1 mb-4">{{ t('project.wizard_codebase_subtitle') }}</div>
        <v-row>
          <v-col cols="6">
            <v-card :variant="form.codebase_source === CODEBASE_SOURCE.GITHUB ? 'tonal' : 'outlined'" :color="form.codebase_source === CODEBASE_SOURCE.GITHUB ? 'primary' : ''" class="pa-4 cursor-pointer text-center" @click="form.codebase_source = CODEBASE_SOURCE.GITHUB">
              <v-icon size="48" class="mb-2">mdi-github</v-icon>
              <div class="text-h6">Clone from GitHub</div>
              <div class="text-caption">Import code from a repository</div>
            </v-card>
          </v-col>
          <v-col cols="6">
            <v-card :variant="form.codebase_source === CODEBASE_SOURCE.ZIP ? 'tonal' : 'outlined'" :color="form.codebase_source === CODEBASE_SOURCE.ZIP ? 'primary' : ''" class="pa-4 cursor-pointer text-center" @click="form.codebase_source = CODEBASE_SOURCE.ZIP">
              <v-icon size="48" class="mb-2">mdi-upload</v-icon>
              <div class="text-h6">Upload ZIP</div>
              <div class="text-caption">Upload your codebase as a ZIP file</div>
            </v-card>
          </v-col>
        </v-row>

        <!-- GitHub repo field for codebase import -->
        <v-expand-transition>
          <div v-if="form.codebase_source === CODEBASE_SOURCE.GITHUB && !isGitHubDelivery" class="mt-4">
            <v-text-field v-model="form.github_repo" :label="t('project.github_repo')" :hint="t('project.github_repo_hint')" variant="outlined" prepend-inner-icon="mdi-github" />
          </div>
        </v-expand-transition>

        <!-- ZIP upload placeholder -->
        <v-expand-transition>
          <div v-if="form.codebase_source === CODEBASE_SOURCE.ZIP" class="mt-4">
            <v-file-input label="Upload ZIP file" variant="outlined" accept=".zip" prepend-inner-icon="mdi-file-upload" />
          </div>
        </v-expand-transition>
      </v-card-text>
      <v-card-actions class="px-0 pt-4">
        <v-btn variant="text" @click="prevStep">
          <v-icon start>mdi-arrow-left</v-icon>
          {{ t('common.back') }}
        </v-btn>
        <v-spacer />
        <v-btn color="primary" variant="elevated" size="large" :disabled="!canProceed" :loading="loading" @click="submit">
          <v-icon start>mdi-content-save</v-icon>
          {{ t('common.save') }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000">
      {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<style scoped>
.cursor-pointer { cursor: pointer; }
</style>
