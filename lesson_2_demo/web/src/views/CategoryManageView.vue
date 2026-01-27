<script setup lang="ts">
/**
 * Category Management View - BKM (Best Known Method)
 *
 * Admin CRUD for categories.
 * Showcases: CrudTable (h-crud) with expandable fields
 *
 * Design Rules (BKM):
 * - Fields with type "text" (long text like description) → expand, not data list
 * - Fields with type "icon" → expand, render icon visually
 * - Search fields column rule:
 *   - 1 field: col = 12 (default)
 *   - 2-4 fields: col = 6
 *   - 5+ fields: col = 4
 */
import { useI18n } from "vue-i18n";

const { t } = useI18n();

const entity = "category";
const itemLabelKey = "name";
const sortKey = ["sortOrder", "name"];
const sortDesc = [false, false];

// BKM: Text and icon fields should be in expand section for better readability
const expandFields = ["description", "icon"];

// Search cols based on number of search fields from server meta
// Rule: 1 field -> 12, 2-4 fields -> 6, 5+ fields -> 4
// Category has 2 search fields (name, active) -> col = 6
const searchCols = 6;

// Custom headers for expand rendering
const headers = [
  {
    name: "description",
    expand: (value: string) => `
      <tr>
        <td style="padding: 8px; font-weight: bold; vertical-align: top; width: 120px;">${t("category.description")}</td>
        <td style="padding: 8px; white-space: pre-wrap;">${value || t("common.no_data")}</td>
      </tr>
    `,
  },
  {
    name: "icon",
    expand: (value: string) => `
      <tr>
        <td style="padding: 8px; font-weight: bold; vertical-align: top; width: 120px;">${t("category.icon")}</td>
        <td style="padding: 8px;">
          <span class="mdi ${value}" style="font-size: 32px;"></span>
          <span style="margin-left: 8px; color: #666;">${value || t("common.no_data")}</span>
        </td>
      </tr>
    `,
  },
];
</script>

<template>
  <v-container fluid>
    <h-bread></h-bread>
    <h-crud :entity="entity" :item-label-key="itemLabelKey" :sort-key="sortKey" :sort-desc="sortDesc" :expand-fields="expandFields" :search-cols="searchCols" :headers="headers" />
  </v-container>
</template>
