<script setup lang="ts">
/**
 * Customer Management View - BKM (Best Known Method)
 *
 * Admin CRUD for customers.
 * Showcases: CrudTable (h-crud) with expandable fields, status chips
 *
 * Design Rules (BKM):
 * - Fields with type "text" (long text like address) → expand, not data list
 * - Status fields → display as colored chips
 * - Search fields column rule:
 *   - 1 field: col = 12 (default)
 *   - 2-4 fields: col = 6
 *   - 5+ fields: col = 4
 */
import { useI18n } from "vue-i18n";
import { CUSTOMER_STATUS } from "@/core/type";

const { t } = useI18n();

const entity = "customer";
const itemLabelKey = "name";
const sortKey = ["createdAt"];
const sortDesc = [true];
const updateView = "1";

// BKM: Text fields (address) should be in expand section for better readability
const expandFields = ["address"];

// Search cols based on number of search fields from server meta
// Rule: 1 field -> 12, 2-4 fields -> 6, 5+ fields -> 4
// Customer has 4 search fields (name, email, role, status) -> col = 6
const searchCols = 6;

// Custom headers for status chip and address expand
const headers = [
  {
    name: "status",
    chip: true,
    format: (value: number) => (value === CUSTOMER_STATUS.ACTIVE ? t("type.customer_status_active") : t("type.customer_status_inactive")),
    style: (value: number) => (value === CUSTOMER_STATUS.ACTIVE ? "success" : "error"),
  },
  {
    name: "address",
    expand: (value: string) => `
      <tr>
        <td style="padding: 8px; font-weight: bold; vertical-align: top; width: 120px;">${t("customer.address")}</td>
        <td style="padding: 8px; white-space: pre-wrap;">${value || t("common.no_data")}</td>
      </tr>
    `,
  },
];
</script>

<template>
  <v-container fluid>
    <h-bread></h-bread>
    <h-crud :entity="entity" :item-label-key="itemLabelKey" :sort-key="sortKey" :sort-desc="sortDesc" :update-view="updateView" :expand-fields="expandFields" :search-cols="searchCols" :headers="headers" />
  </v-container>
</template>
