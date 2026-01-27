<script setup lang="ts">
/**
 * Root App Component
 *
 * Main entry point for the E-Commerce Views Showcase.
 * Handles layout switching between login and main app.
 */
import { ref, reactive, watch } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import NavBar from "./components/NavBar.vue";

// Route
const route = useRoute();

// i18n
const { t } = useI18n();

// Refs
const navBarRef = ref<{ loadUserRole: () => void } | null>(null);

// State
const alert = reactive({
  shown: false,
  type: "info" as "info" | "success" | "warning" | "error",
  msg: "",
});

// Watch for route changes to refresh user role
watch(
  () => route.path,
  () => {
    // Refresh user role when navigating from login
    if (!route.meta.login) {
      navBarRef.value?.loadUserRole();
    }
  }
);

// Methods
interface AlertMessage {
  type?: "info" | "success" | "warning" | "error";
  msg?: string;
  delay?: number;
}

const showAlert = (msgObj: AlertMessage) => {
  const { type = "info", msg = "", delay } = msgObj;
  const time = delay ?? 10 * 1000;
  alert.shown = true;
  alert.type = type;
  alert.msg = msg.replace(/\n/g, "<br />");
  if (!delay && delay !== 0) {
    setTimeout(() => (alert.shown = false), time);
  }
};
</script>

<template>
  <div>
    <!-- Login Page (no navbar) -->
    <template v-if="route.meta.login">
      <router-view />
    </template>

    <!-- Main App (with navbar) -->
    <template v-else>
      <v-app>
        <NavBar ref="navBarRef" :title="t('app.title')" />

        <v-main>
          <!-- Alert Banner -->
          <div v-if="alert.shown" class="ma-3">
            <v-alert v-model="alert.shown" :type="alert.type" closable variant="tonal">
              <span v-html="alert.msg"></span>
            </v-alert>
          </div>

          <!-- Route Content -->
          <router-view :key="route.fullPath" class="ma-3" @alert="showAlert" />
        </v-main>
      </v-app>
    </template>
  </div>
</template>

<style>
/* Global styles */
html,
body {
  margin: 0;
  padding: 0;
  font-family: "Roboto", sans-serif;
}

/* Smooth transitions */
.v-main {
  transition: padding 0.2s ease-in-out;
}
</style>
