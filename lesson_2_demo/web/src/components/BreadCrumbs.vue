<script setup lang="ts">
/**
 * BreadCrumbs Component (h-bread) - Vue 3 Composition API
 *
 * Navigation breadcrumbs with close button to go back.
 * Shows current page hierarchy for better user orientation.
 */
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";

interface BreadcrumbItem {
  title: string;
  disabled: boolean;
  href?: string;
}

const router = useRouter();
const route = useRoute();
const { t } = useI18n();

const home = "/";
const items = ref<BreadcrumbItem[]>([]);

// Build breadcrumb items based on current route
const buildBreadcrumbs = () => {
  const path = route.path;
  const paths = path.split("/").filter(Boolean);

  // Default: Dashboard as home
  const dashboardItem: BreadcrumbItem = {
    title: t("menu.dashboard"),
    disabled: false,
    href: "/admin/dashboard",
  };

  // Handle admin routes
  if (paths[0] === "admin") {
    const section = paths[1];

    switch (section) {
      case "dashboard":
        items.value = [{ title: t("menu.dashboard"), disabled: true }];
        break;
      case "categories":
        items.value = [dashboardItem, { title: t("menu.manage_categories"), disabled: true }];
        break;
      case "products":
        items.value = [dashboardItem, { title: t("menu.manage_products"), disabled: true }];
        break;
      case "orders":
        items.value = [dashboardItem, { title: t("menu.manage_orders"), disabled: true }];
        break;
      case "customers":
        items.value = [dashboardItem, { title: t("menu.manage_customers"), disabled: true }];
        break;
      default:
        items.value = [dashboardItem];
    }
  }
  // Handle public/user routes
  else if (paths[0] === "products") {
    items.value = [{ title: t("menu.products"), disabled: true }];
  } else if (paths[0] === "product") {
    items.value = [
      { title: t("menu.products"), disabled: false, href: "/products" },
      { title: t("common.detail") || "Detail", disabled: true },
    ];
  } else if (paths[0] === "cart") {
    items.value = [
      { title: t("menu.products"), disabled: false, href: "/products" },
      { title: t("menu.cart"), disabled: true },
    ];
  } else if (paths[0] === "my-orders") {
    items.value = [
      { title: t("menu.products"), disabled: false, href: "/products" },
      { title: t("menu.my_orders"), disabled: true },
    ];
  } else {
    // Fallback
    items.value = [{ title: t("menu.products"), disabled: true }];
  }
};

// Navigate to previous breadcrumb on close
const close = () => {
  if (items.value.length > 1) {
    const last = items.value[items.value.length - 2];
    if (last.href && route.path !== home) {
      router.push({ path: last.href });
    }
  }
};

onMounted(() => {
  buildBreadcrumbs();
});
</script>

<template>
  <v-system-bar window class="system_bar mb-3">
    <v-breadcrumbs :items="items">
      <template #divider>
        <v-icon>mdi-chevron-right</v-icon>
      </template>
    </v-breadcrumbs>
    <v-spacer></v-spacer>
    <v-icon @click="close" style="cursor: pointer">mdi-close</v-icon>
  </v-system-bar>
</template>

<style scoped>
.system_bar {
  background-color: rgb(var(--v-theme-surface));
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}
</style>
