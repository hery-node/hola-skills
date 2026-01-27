<script setup lang="ts">
/**
 * My Orders View
 *
 * User's order history with details.
 * Showcases: DataTable, StatisticsView, BasicWindow
 */
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { axiosGet, axiosPost, isSuccessResponse } from "hola-web";
import type { Order } from "@/core/type";
import { ORDER_STATUS, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/core/type";

// i18n
const { t } = useI18n();

// State
const loading = ref(false);
const orders = ref<Order[]>([]);
const selectedOrder = ref<Order | null>(null);
const showDetailDialog = ref(false);
const snackbar = ref(false);
const snackbarMessage = ref("");
const snackbarColor = ref("success");

// Computed
const stats = computed(() => {
  const total = orders.value.length;
  const pending = orders.value.filter((o) => o.status === ORDER_STATUS.PENDING).length;
  const delivered = orders.value.filter((o) => o.status === ORDER_STATUS.DELIVERED).length;
  const totalSpent = orders.value.filter((o) => o.status !== ORDER_STATUS.CANCELLED).reduce((sum, o) => sum + o.totalAmount, 0);
  return { total, pending, delivered, totalSpent };
});

// Response types
interface OrderListResponse {
  code: number;
  data: Order[];
}

interface ActionResponse {
  code: number;
  err?: string;
}

// Methods
const loadOrders = async () => {
  loading.value = true;
  const response = await axiosGet<OrderListResponse>("/order/my");
  if (isSuccessResponse(response.code)) {
    orders.value = response.data || [];
  }
  loading.value = false;
};

const viewOrder = (order: Order) => {
  selectedOrder.value = order;
  showDetailDialog.value = true;
};

const cancelOrder = async (order: Order) => {
  const response = await axiosPost<ActionResponse>(`/order/cancel/${order._id}`);
  if (isSuccessResponse(response.code)) {
    snackbarMessage.value = "Order cancelled successfully";
    snackbarColor.value = "success";
    loadOrders();
  } else {
    snackbarMessage.value = response.err || "Failed to cancel order";
    snackbarColor.value = "error";
  }
  snackbar.value = true;
};

const formatPrice = (price: string) => `$${Number(price).toFixed(2)}`;

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getStatusLabel = (status: number) => ORDER_STATUS_LABELS[status] || "Unknown";
const getStatusColor = (status: number) => ORDER_STATUS_COLORS[status] || "grey";

// Lifecycle
onMounted(() => {
  loadOrders();
});
</script>

<template>
  <v-container>
    <h1 class="text-h4 mb-6">
      <v-icon start>mdi-package-variant</v-icon>
      {{ t("menu.my_orders") }}
    </h1>

    <!-- Statistics Cards -->
    <v-row class="mb-6">
      <v-col cols="6" md="3">
        <v-card class="pa-4 text-center" color="primary" variant="tonal">
          <v-icon size="40">mdi-clipboard-list</v-icon>
          <div class="text-h4 mt-2">{{ stats.total }}</div>
          <div class="text-body-2">{{ t("my_orders.total_orders") }}</div>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card class="pa-4 text-center" color="warning" variant="tonal">
          <v-icon size="40">mdi-clock-outline</v-icon>
          <div class="text-h4 mt-2">{{ stats.pending }}</div>
          <div class="text-body-2">{{ t("my_orders.pending") }}</div>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card class="pa-4 text-center" color="success" variant="tonal">
          <v-icon size="40">mdi-check-circle</v-icon>
          <div class="text-h4 mt-2">{{ stats.delivered }}</div>
          <div class="text-body-2">{{ t("my_orders.delivered") }}</div>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card class="pa-4 text-center" color="info" variant="tonal">
          <v-icon size="40">mdi-currency-usd</v-icon>
          <div class="text-h4 mt-2">{{ formatPrice(stats.totalSpent) }}</div>
          <div class="text-body-2">{{ t("my_orders.total_spent") }}</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Loading -->
    <v-card v-if="loading" class="pa-10 text-center">
      <v-progress-circular indeterminate color="primary" size="60" />
    </v-card>

    <!-- Empty State -->
    <v-card v-else-if="orders.length === 0" class="pa-10 text-center">
      <v-icon size="100" color="grey-lighten-1">mdi-package-variant</v-icon>
      <h2 class="text-h5 text-grey mt-4">{{ t("my_orders.no_orders") }}</h2>
      <p class="text-grey">{{ t("my_orders.start_shopping") }}</p>
    </v-card>

    <!-- Orders Table -->
    <v-card v-else rounded="lg" elevation="1" border>
      <v-data-table
        :headers="[
          { title: t('my_orders.order_number'), key: 'orderNo', sortable: true },
          { title: t('my_orders.date'), key: 'createdAt', sortable: true },
          { title: t('my_orders.items'), key: 'items', sortable: false },
          { title: t('my_orders.total'), key: 'totalAmount', sortable: true },
          { title: t('my_orders.status'), key: 'status', sortable: true },
          { title: t('my_orders.actions'), key: 'actions', sortable: false },
        ]"
        :items="orders"
        :sort-by="[{ key: 'createdAt', order: 'desc' }]"
        item-value="_id"
      >
        <template #item.createdAt="{ item }">
          {{ formatDate(item.createdAt) }}
        </template>

        <template #item.items="{ item }"> {{ item.items.length }} item(s) </template>

        <template #item.totalAmount="{ item }">
          <span class="font-weight-bold">{{ formatPrice(item.totalAmount) }}</span>
        </template>

        <template #item.status="{ item }">
          <v-chip :color="getStatusColor(item.status)" size="small">
            {{ getStatusLabel(item.status) }}
          </v-chip>
        </template>

        <template #item.actions="{ item }">
          <v-btn icon size="small" variant="text" @click="viewOrder(item)">
            <v-icon>mdi-eye</v-icon>
            <v-tooltip activator="parent" location="top">{{ t("my_orders.view_details") }}</v-tooltip>
          </v-btn>
          <v-btn v-if="item.status === ORDER_STATUS.PENDING" icon size="small" variant="text" color="error" @click="cancelOrder(item)">
            <v-icon>mdi-cancel</v-icon>
            <v-tooltip activator="parent" location="top">{{ t("order.cancel_order") }}</v-tooltip>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- Order Detail Dialog -->
    <v-dialog v-model="showDetailDialog" max-width="600">
      <v-card v-if="selectedOrder" rounded="lg">
        <v-card-title class="d-flex align-center">
          <v-icon start>mdi-receipt</v-icon>
          {{ t("my_orders.order_details") }} {{ selectedOrder.orderNo }}
          <v-spacer />
          <v-chip :color="getStatusColor(selectedOrder.status)" size="small">
            {{ getStatusLabel(selectedOrder.status) }}
          </v-chip>
        </v-card-title>

        <v-divider />

        <v-card-text>
          <!-- Order Info -->
          <v-list density="compact">
            <v-list-item>
              <template #prepend>
                <v-icon>mdi-calendar</v-icon>
              </template>
              <v-list-item-title>Order Date</v-list-item-title>
              <v-list-item-subtitle>{{ formatDate(selectedOrder.createdAt) }}</v-list-item-subtitle>
            </v-list-item>

            <v-list-item v-if="selectedOrder.shippedAt">
              <template #prepend>
                <v-icon>mdi-truck</v-icon>
              </template>
              <v-list-item-title>Shipped Date</v-list-item-title>
              <v-list-item-subtitle>{{ formatDate(selectedOrder.shippedAt) }}</v-list-item-subtitle>
            </v-list-item>

            <v-list-item v-if="selectedOrder.deliveredAt">
              <template #prepend>
                <v-icon>mdi-check-circle</v-icon>
              </template>
              <v-list-item-title>Delivered Date</v-list-item-title>
              <v-list-item-subtitle>{{ formatDate(selectedOrder.deliveredAt) }}</v-list-item-subtitle>
            </v-list-item>
          </v-list>

          <v-divider class="my-4" />

          <!-- Order Items -->
          <h4 class="text-h6 mb-2">Items</h4>
          <v-table density="compact">
            <thead>
              <tr>
                <th>Product</th>
                <th class="text-center">Qty</th>
                <th class="text-right">Price</th>
                <th class="text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in selectedOrder.items" :key="index">
                <td>{{ item.productName || "Product" }}</td>
                <td class="text-center">{{ item.quantity }}</td>
                <td class="text-right">{{ formatPrice(item.price) }}</td>
                <td class="text-right">{{ formatPrice(item.price * item.quantity) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" class="text-right font-weight-bold">Total:</td>
                <td class="text-right font-weight-bold text-primary">
                  {{ formatPrice(selectedOrder.totalAmount) }}
                </td>
              </tr>
            </tfoot>
          </v-table>

          <!-- Note -->
          <v-alert v-if="selectedOrder.note" type="info" variant="tonal" class="mt-4" density="compact"> <strong>Note:</strong> {{ selectedOrder.note }} </v-alert>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showDetailDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="3000">
      {{ snackbarMessage }}
    </v-snackbar>
  </v-container>
</template>
