<script setup lang="ts">
/**
 * Product Management View - BKM (Best Known Method)
 *
 * Admin CRUD for products with publish/unpublish actions.
 * Showcases: CrudTable (h-crud), Custom Actions, ConfirmDialog
 *
 * Design Rules (BKM):
 * - Fields with type "text" (description) → expand, not data list
 * - Image fields → expand with thumbnail rendering
 * - Status fields → display as colored chips
 * - All user-facing text MUST use i18n (BKM #23)
 * - Search fields column rule:
 *   - 1 field: col = 12 (default)
 *   - 2-4 fields: col = 6
 *   - 5+ fields: col = 4
 */
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { axiosPost, isSuccessResponse } from "hola-web";
import { PRODUCT_STATUS } from "@/core/type";
import type { Product } from "@/core/type";

// i18n
const { t } = useI18n();

// Refs
const crudRef = ref<{ refresh: () => void } | null>(null);

// State
const snackbar = ref(false);
const snackbarMessage = ref("");
const snackbarColor = ref("success");

// Entity config
const entity = "product";
const itemLabelKey = "name";
const sortKey = ["createdAt"];
const sortDesc = [true];

// BKM: 3 search fields (name, category, status) → col = 6
const searchCols = 6;

// BKM: Text fields (description) and image should be in expand section
const expandFields = ["description", "image"];

// Custom actions
const actions = [
  {
    icon: "mdi-publish",
    color: "success",
    tooltip: t("product.publish"),
    handle: async (item: Product) => {
      await publishProduct(item._id);
    },
    shown: (item: Product) => item.status === PRODUCT_STATUS.DRAFT,
  },
  {
    icon: "mdi-publish-off",
    color: "warning",
    tooltip: t("product.unpublish"),
    handle: async (item: Product) => {
      await unpublishProduct(item._id);
    },
    shown: (item: Product) => item.status === PRODUCT_STATUS.PUBLISHED,
  },
  {
    icon: "mdi-cancel",
    color: "error",
    tooltip: t("product.discontinue"),
    handle: async (item: Product) => {
      await discontinueProduct(item._id);
    },
    shown: (item: Product) => item.status !== PRODUCT_STATUS.DISCONTINUED,
  },
];

// Custom headers for status chip and expand fields
const headers = [
  {
    name: "status",
    chip: true,
    format: (value: number) => {
      if (value === PRODUCT_STATUS.DRAFT) return t("type.product_status_draft");
      if (value === PRODUCT_STATUS.PUBLISHED) return t("type.product_status_published");
      return t("type.product_status_discontinued");
    },
    style: (value: number) => {
      if (value === PRODUCT_STATUS.PUBLISHED) return "success";
      if (value === PRODUCT_STATUS.DRAFT) return "warning";
      return "error";
    },
  },
  {
    name: "description",
    expand: (value: string) => `
      <tr>
        <td style="padding: 8px; font-weight: bold; vertical-align: top; width: 120px;">${t("product.description")}</td>
        <td style="padding: 8px; white-space: pre-wrap;">${value || t("common.no_data")}</td>
      </tr>
    `,
  },
  {
    name: "image",
    expand: (value: string) => `
      <tr>
        <td style="padding: 8px; font-weight: bold; vertical-align: top; width: 120px;">${t("product.image")}</td>
        <td style="padding: 8px;">
          ${value ? `<img src="${value}" alt="${t("product.image")}" style="max-width: 200px; max-height: 150px; border-radius: 4px;">` : `<span>${t("common.no_image")}</span>`}
        </td>
      </tr>
    `,
  },
];

// Response type
interface ActionResponse {
  code: number;
  err?: string;
}

// Methods
const showMessage = (message: string, color = "success") => {
  snackbarMessage.value = message;
  snackbarColor.value = color;
  snackbar.value = true;
};

const publishProduct = async (id: string) => {
  const response = await axiosPost<ActionResponse>(`/product/publish/${id}`);
  if (isSuccessResponse(response.code)) {
    showMessage(t("product.publish_success"));
    crudRef.value?.refresh();
  } else {
    showMessage(response.err || t("product.publish_error"), "error");
  }
};

const unpublishProduct = async (id: string) => {
  const response = await axiosPost<ActionResponse>(`/product/unpublish/${id}`);
  if (isSuccessResponse(response.code)) {
    showMessage(t("product.unpublish_success"));
    crudRef.value?.refresh();
  } else {
    showMessage(response.err || t("product.unpublish_error"), "error");
  }
};

const discontinueProduct = async (id: string) => {
  const response = await axiosPost<ActionResponse>(`/product/discontinue/${id}`);
  if (isSuccessResponse(response.code)) {
    showMessage(t("product.discontinue_success"));
    crudRef.value?.refresh();
  } else {
    showMessage(response.err || t("product.discontinue_error"), "error");
  }
};
</script>

<template>
  <v-container fluid>
    <h-bread></h-bread>

    <h-crud ref="crudRef" :entity="entity" :item-label-key="itemLabelKey" :sort-key="sortKey" :sort-desc="sortDesc" :search-cols="searchCols" :actions="actions" :headers="headers" :expand-fields="expandFields" />

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="3000">
      {{ snackbarMessage }}
    </v-snackbar>
  </v-container>
</template>
