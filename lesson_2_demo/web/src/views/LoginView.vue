<script setup lang="ts">
/**
 * Login View
 *
 * User authentication with registration option.
 */
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { axiosPost, isSuccessResponse } from "hola-web";
import { setAuthState } from "@/main";

// Router & i18n
const router = useRouter();
const { t } = useI18n();

// State
const isRegister = ref(false);
const loading = ref(false);
const snackbar = ref(false);
const snackbarMessage = ref("");
const snackbarColor = ref("error");
const showPassword = ref(false);

// Form data
const form = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null);
const name = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");

// Validation rules
const rules = computed(() => ({
  required: [(v: string) => !!v || t("login.required")],
  email: [(v: string) => !!v || t("login.required"), (v: string) => /.+@.+\..+/.test(v) || "Invalid email"],
  confirmPassword: [(v: string) => !!v || t("login.required"), (v: string) => v === password.value || t("register.password_mismatch")],
}));

// Response types
interface AuthResponse {
  code: number;
  role: string | null;
  root: boolean;
  user?: { id: string; name: string; email: string };
  err?: string;
}

// Methods
const showError = (message: string) => {
  snackbarMessage.value = message;
  snackbarColor.value = "error";
  snackbar.value = true;
};

const showSuccess = (message: string) => {
  snackbarMessage.value = message;
  snackbarColor.value = "success";
  snackbar.value = true;
};

const login = async () => {
  const validation = await form.value?.validate();
  if (!validation?.valid) {
    showError(t("login.error"));
    return;
  }

  loading.value = true;

  const response = await axiosPost<AuthResponse>("/customer/login", {
    email: email.value,
    password: password.value,
  });

  if (isSuccessResponse(response.code)) {
    setAuthState(response.role);
    router.push({ name: response.root ? "dashboard" : "products" });
  } else {
    showError(response.err || t("login.not_matched"));
  }

  loading.value = false;
};

const register = async () => {
  const validation = await form.value?.validate();
  if (!validation?.valid) {
    showError(t("login.error"));
    return;
  }

  loading.value = true;

  const response = await axiosPost<AuthResponse>("/customer/register", {
    name: name.value,
    email: email.value,
    password: password.value,
  });

  if (isSuccessResponse(response.code)) {
    showSuccess(t("register.success"));
    setAuthState(response.role);
    router.push({ name: "products" });
  } else {
    showError(response.err || "Registration failed");
  }

  loading.value = false;
};

const toggleMode = () => {
  isRegister.value = !isRegister.value;
  // Reset form
  name.value = "";
  email.value = "";
  password.value = "";
  confirmPassword.value = "";
};
</script>

<template>
  <v-app id="login">
    <v-main>
      <v-container fluid class="fill-height">
        <v-row align="center" justify="center">
          <v-col cols="12" sm="8" md="6" lg="4">
            <v-form ref="form" @submit.prevent="isRegister ? register() : login()">
              <v-card class="elevation-12 pa-6" rounded="xl">
                <v-card-text>
                  <div class="d-flex flex-column align-center mb-6">
                    <v-avatar color="primary" size="80" class="mb-4">
                      <v-icon size="40" color="white">mdi-store</v-icon>
                    </v-avatar>
                    <h1 class="text-h4 font-weight-bold text-primary">
                      {{ isRegister ? t("register.title") : t("login.title") }}
                    </h1>
                    <div class="text-caption text-medium-emphasis mt-1">
                      {{ isRegister ? "Create your account" : "Welcome back to Hola Store" }}
                    </div>
                  </div>

                  <!-- Name (Register only) -->
                  <v-text-field v-if="isRegister" v-model="name" prepend-inner-icon="mdi-account" :label="t('register.name')" :rules="rules.required" variant="outlined" density="comfortable" class="mb-4" color="primary" />

                  <!-- Email -->
                  <v-text-field v-model="email" prepend-inner-icon="mdi-email" :label="t('login.email')" :rules="rules.email" type="email" variant="outlined" density="comfortable" class="mb-4" color="primary" autofocus />

                  <!-- Password -->
                  <v-text-field v-model="password" prepend-inner-icon="mdi-lock" :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'" :label="t('login.password')" :type="showPassword ? 'text' : 'password'" :rules="rules.required" variant="outlined" density="comfortable" class="mb-4" color="primary" @click:append-inner="showPassword = !showPassword" />

                  <!-- Confirm Password (Register only) -->
                  <v-text-field v-if="isRegister" v-model="confirmPassword" prepend-inner-icon="mdi-lock-check" :label="t('register.confirm_password')" :type="showPassword ? 'text' : 'password'" :rules="rules.confirmPassword" variant="outlined" density="comfortable" class="mb-4" color="primary" />
                </v-card-text>

                <v-card-actions class="flex-column px-4">
                  <v-btn type="submit" block size="large" color="primary" variant="elevated" :loading="loading" class="text-none text-subtitle-1 rounded-pill" elevation="2">
                    {{ isRegister ? t("register.button") : t("login.button") }}
                  </v-btn>

                  <div class="mt-6 text-center">
                    <span class="text-body-2 text-medium-emphasis">
                      {{ isRegister ? t("login.has_account") : t("login.no_account") }}
                    </span>
                    <v-btn variant="text" color="primary" class="px-2 text-none font-weight-bold" @click="toggleMode">
                      {{ isRegister ? t("login.button") : t("register.button") }}
                    </v-btn>
                  </div>
                </v-card-actions>
              </v-card>
            </v-form>

            <!-- Demo credentials hint -->
            <v-alert type="info" variant="tonal" class="mt-6 mx-auto" style="max-width: 400px; backdrop-filter: blur(10px); background-color: rgba(255, 255, 255, 0.9)" density="compact" border="start" border-color="primary">
              <template #prepend>
                <v-icon color="primary">mdi-information</v-icon>
              </template>
              <div class="text-caption">
                <strong>Demo Credentials:</strong><br />
                Admin: admin@demo.com / admin123<br />
                User: john@demo.com / user123
              </div>
            </v-alert>
          </v-col>
        </v-row>
      </v-container>

      <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="4000" location="top">
        {{ snackbarMessage }}
        <template #actions>
          <v-btn variant="text" @click="snackbar = false">{{ t("login.close") }}</v-btn>
        </template>
      </v-snackbar>
    </v-main>
  </v-app>
</template>

<style scoped>
#login {
  background: linear-gradient(135deg, #1565c0 0%, #42a5f5 100%);
  min-height: 100vh;
}
</style>
