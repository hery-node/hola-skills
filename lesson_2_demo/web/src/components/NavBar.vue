<script setup lang="ts">
/**
 * Navigation Bar Component
 *
 * Role-based navigation with cart badge.
 */
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { axiosGet, isSuccessResponse } from "hola-web";
import { useCart } from "@/composables/useCart";
import { getMenus, resetAuthState } from "@/main";

// Props
defineProps<{
  title: string;
}>();

// Router & i18n
const router = useRouter();
const { t } = useI18n();

// Cart
const { itemCount } = useCart();

// State
const role = ref<string | null>(null);
const user = ref<{ id: string; name: string } | null>(null);

// Computed
const menus = computed(() => getMenus(t, role.value));
const isLoggedIn = computed(() => !!user.value);
const isAdmin = computed(() => role.value === "admin");

// Response types
interface RoleResponse {
  code: number;
  role: string | null;
  user: { id: string; name: string } | null;
}

interface LogoutResponse {
  code: number;
}

// Methods
const loadUserRole = async () => {
  const response = await axiosGet<RoleResponse>("/customer/role");
  if (isSuccessResponse(response.code)) {
    role.value = response.role;
    user.value = response.user;
  }
};

const logout = async () => {
  const { code } = await axiosGet<LogoutResponse>("/customer/logout");
  if (isSuccessResponse(code)) {
    role.value = null;
    user.value = null;
    resetAuthState(); // Reset auth state in main.ts
    router.push({ name: "login" });
  }
};

const goToCart = () => {
  router.push({ name: "cart" });
};

const goToLogin = () => {
  router.push({ name: "login" });
};

// Expose for external refresh
defineExpose({ loadUserRole });

// Lifecycle
onMounted(() => {
  loadUserRole();
});
</script>

<template>
  <h-navbar :title="title" :menus="menus">
    <template #toolbar>
      <!-- Cart Button (always visible) -->
      <v-btn icon class="mr-2" @click="goToCart">
        <v-badge :content="itemCount" :model-value="itemCount > 0" color="error" overlap>
          <v-icon>mdi-cart</v-icon>
        </v-badge>
      </v-btn>

      <!-- User Menu or Login Button -->
      <template v-if="isLoggedIn">
        <v-menu>
          <template #activator="{ props }">
            <v-btn icon v-bind="props">
              <v-icon>mdi-account-circle</v-icon>
            </v-btn>
          </template>
          <v-list>
            <v-list-item>
              <v-list-item-title class="font-weight-bold">{{ user?.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ isAdmin ? "Administrator" : "Customer" }}</v-list-item-subtitle>
            </v-list-item>
            <v-divider />
            <v-list-item @click="logout">
              <template #prepend>
                <v-icon>mdi-logout</v-icon>
              </template>
              <v-list-item-title>{{ t("app.logout_hint") }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </template>
      <template v-else>
        <v-btn variant="outlined" size="small" @click="goToLogin">
          <v-icon start>mdi-login</v-icon>
          {{ t("app.login_hint") }}
        </v-btn>
      </template>
    </template>
  </h-navbar>
</template>
