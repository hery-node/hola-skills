<script setup lang="ts">
/**
 * Order Management View - BKM (Best Known Method)
 *
 * Admin view for all orders with status workflow.
 * Showcases: CrudTable, SearchForm, BasicWindow, Status Update
 *
 * Design Rules (BKM):
 * - Fields with type "text" (note) → expand, not data list
 * - Array fields (items) → expand with proper formatting
 * - Status fields → display as colored chips
 * - All user-facing text MUST use i18n (BKM #23)
 * - Search fields column rule:
 *   - 1 field: col = 12 (default)
 *   - 2-4 fields: col = 6
 *   - 5+ fields: col = 4
 */
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { axiosPost, isSuccessResponse } from "hola-web";
import { ORDER_STATUS } from "@/core/type";
import type { Order, OrderItem } from "@/core/type";

// i18n
const { t } = useI18n();

// Refs
const crudRef = ref<{ refresh: () => void } | null>(null);

// State
const snackbar = ref(false);
const snackbarMessage = ref("");
const snackbarColor = ref("success");
const showStatusDialog = ref(false);
const selectedOrder = ref<Order | null>(null);
const selectedStatus = ref<number>(0);

// Entity config
const entity = "order";
const itemLabelKey = "orderNo";
const sortKey = ["createdAt"];
const sortDesc = [true];

// BKM: 3 search fields (orderNo, customer, status) → col = 6
const searchCols = 6;

// BKM: Array fields (items) and text fields (note) should be in expand section
const expandFields = ["items", "note"];

// Status options for dropdown - using i18n
const statusOptions = computed(() => [
  { value: ORDER_STATUS.PENDING, title: t("type.order_status_pending") },
  { value: ORDER_STATUS.PAID, title: t("type.order_status_paid") },
  { value: ORDER_STATUS.SHIPPED, title: t("type.order_status_shipped") },
  { value: ORDER_STATUS.DELIVERED, title: t("type.order_status_delivered") },
  { value: ORDER_STATUS.CANCELLED, title: t("type.order_status_cancelled") },
]);

// Custom actions
const actions = [
  {
    icon: "mdi-truck-delivery",
    color: "primary",
    tooltip: t("order.update_status"),
    handle: (item: Order) => {
      selectedOrder.value = item;
      selectedStatus.value = item.status;
      showStatusDialog.value = true;
    },
    shown: (item: Order) => item.status !== ORDER_STATUS.DELIVERED && item.status !== ORDER_STATUS.CANCELLED,
  },
];

// Custom headers for status chip and expand fields
const headers = [
  {
    name: "status",
    chip: true,
    format: (value: number) => {
      if (value === ORDER_STATUS.PENDING) return t("type.order_status_pending");
      if (value === ORDER_STATUS.PAID) return t("type.order_status_paid");
      if (value === ORDER_STATUS.SHIPPED) return t("type.order_status_shipped");
      if (value === ORDER_STATUS.DELIVERED) return t("type.order_status_delivered");
      return t("type.order_status_cancelled");
    },
    style: (value: number) => {
      if (value === ORDER_STATUS.PENDING) return "warning";
      if (value === ORDER_STATUS.PAID) return "info";
      if (value === ORDER_STATUS.SHIPPED) return "primary";
      if (value === ORDER_STATUS.DELIVERED) return "success";
      return "error";
    },
  },
  {
    name: "totalAmount",
    format: (value: number) => `$${value?.toFixed(2) || "0.00"}`,
  },
  {
    name: "items",
    expand: (value: OrderItem[]) => {
      if (!value || value.length === 0) {
        return `
          <tr>
            <td style="padding: 8px; font-weight: bold; vertical-align: top; width: 120px;">${t("order.items")}</td>
            <td style="padding: 8px;">${t("common.no_data")}</td>
          </tr>
        `;
      }
      const itemsHtml = value
        .map(
          (item) => `
          <div style="display: flex; align-items: center; padding: 4px 0; border-bottom: 1px solid #eee;">
            <span style="flex: 1;">${item.name || t("common.no_data")}</span>
            <span style="width: 80px; text-align: center;">x${item.quantity || 1}</span>
            <span style="width: 100px; text-align: right;">$${((item.price || 0) * (item.quantity || 1)).toFixed(2)}</span>
          </div>
        `
        )
        .join("");
      return `
        <tr>
          <td style="padding: 8px; font-weight: bold; vertical-align: top; width: 120px;">${t("order.items")}</td>
          <td style="padding: 8px;">
            <div style="max-width: 400px;">${itemsHtml}</div>
          </td>
        </tr>
      `;
    },
  },
  {
    name: "note",
    expand: (value: string) => `
      <tr>
        <td style="padding: 8px; font-weight: bold; vertical-align: top; width: 120px;">${t("order.note")}</td>
        <td style="padding: 8px; white-space: pre-wrap;">${value || t("common.no_data")}</td>
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

const getStatusColor = (status: number) => {
  if (status === ORDER_STATUS.PENDING) return "warning";
  if (status === ORDER_STATUS.PAID) return "info";
  if (status === ORDER_STATUS.SHIPPED) return "primary";
  if (status === ORDER_STATUS.DELIVERED) return "success";
  return "error";
};

const updateOrderStatus = async () => {
  if (!selectedOrder.value) return;

  const response = await axiosPost<ActionResponse>(`/order/status/${selectedOrder.value._id}`, {
    status: selectedStatus.value,
  });

  if (isSuccessResponse(response.code)) {
    showMessage(t("order.status_updated"));
    showStatusDialog.value = false;
    crudRef.value?.refresh();
  } else {
    showMessage(response.err || t("order.status_update_error"), "error");
  }
};
</script>

<template>
  <v-container fluid>
    <h-bread></h-bread>
    <h-crud ref="crudRef" :entity="entity" :item-label-key="itemLabelKey" :sort-key="sortKey" :sort-desc="sortDesc" :search-cols="searchCols" :actions="actions" :headers="headers" :expand-fields="expandFields" />

    <!-- Status Update Dialog -->
    <v-dialog v-model="showStatusDialog" max-width="400">
      <v-card v-if="selectedOrder">
        <v-card-title> {{ t("view.update_order_status") }} </v-card-title>
        <v-card-subtitle> {{ t("order.orderNo") }}: {{ selectedOrder.orderNo }} </v-card-subtitle>

        <v-card-text>
          <v-select v-model="selectedStatus" :items="statusOptions" item-title="title" item-value="value" :label="t('order.new_status')" variant="outlined">
            <template #selection="{ item }">
              <v-chip :color="getStatusColor(item.value)" size="small">
                {{ item.title }}
              </v-chip>
            </template>
            <template #item="{ item, props }">
              <v-list-item v-bind="props">
                <template #prepend>
                  <v-icon :color="getStatusColor(item.value)">mdi-circle</v-icon>
                </template>
              </v-list-item>
            </template>
          </v-select>

          <!-- Status Workflow Guide -->
          <v-alert type="info" variant="tonal" density="compact" class="mt-4">
            <strong>{{ t("order.workflow_title") }}</strong
            ><br />
            {{ t("order.workflow_hint") }}
          </v-alert>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showStatusDialog = false">
            {{ t("common.cancel") }}
          </v-btn>
          <v-btn color="primary" variant="elevated" @click="updateOrderStatus">
            {{ t("common.save") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="3000">
      {{ snackbarMessage }}
    </v-snackbar>
  </v-container>
</template>
