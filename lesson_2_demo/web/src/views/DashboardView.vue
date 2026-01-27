<script setup lang="ts">
/**
 * Admin Dashboard View
 *
 * Dashboard with statistics and charts.
 * Showcases: StatisticsView, ChartBarView, ChartLineView, ChartPieView
 */
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { axiosGet, isSuccessResponse } from "hola-web";
import type { DashboardStats } from "@/core/type";

// i18n
const { t } = useI18n();

// State
const loading = ref(false);
const stats = ref<DashboardStats>({
  totalCustomers: 0,
  totalProducts: 0,
  totalOrders: 0,
  totalCategories: 0,
  totalRevenue: 0,
  pendingOrders: 0,
});
const salesByMonth = ref<(string | number)[][]>([]);
const ordersByStatus = ref<(string | number)[][]>([]);
const salesByCategory = ref<(string | number)[][]>([]);
const orderTrend = ref<(string | number)[][]>([]);

// Response types
interface StatsResponse {
  code: number;
  data: DashboardStats;
}

interface ChartResponse {
  code: number;
  data: (string | number)[][];
}

// Methods
const loadStats = async () => {
  const response = await axiosGet<StatsResponse>("/dashboard/stats");
  if (isSuccessResponse(response.code)) {
    stats.value = response.data;
  }
};

const loadCharts = async () => {
  const [salesMonth, orderStatus, salesCat, trend] = await Promise.all([axiosGet<ChartResponse>("/dashboard/sales-by-month"), axiosGet<ChartResponse>("/dashboard/orders-by-status"), axiosGet<ChartResponse>("/dashboard/sales-by-category"), axiosGet<ChartResponse>("/dashboard/order-trend")]);

  if (isSuccessResponse(salesMonth.code)) {
    salesByMonth.value = salesMonth.data;
  }
  if (isSuccessResponse(orderStatus.code)) {
    ordersByStatus.value = orderStatus.data;
  }
  if (isSuccessResponse(salesCat.code)) {
    salesByCategory.value = salesCat.data;
  }
  if (isSuccessResponse(trend.code)) {
    orderTrend.value = trend.data;
  }
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

// Lifecycle
onMounted(async () => {
  loading.value = true;
  await Promise.all([loadStats(), loadCharts()]);
  loading.value = false;
});
</script>

<template>
  <v-container fluid>
    <h1 class="text-h4 mb-6">
      <v-icon start>mdi-view-dashboard</v-icon>
      {{ t("dashboard.title") }}
    </h1>

    <!-- Loading -->
    <v-row v-if="loading" justify="center">
      <v-col cols="12" class="text-center py-10">
        <v-progress-circular indeterminate color="primary" size="60" />
      </v-col>
    </v-row>

    <template v-else>
      <!-- Statistics Cards -->
      <v-row class="mb-6">
        <v-col cols="12" sm="6" md="4" lg="2">
          <h-stats icon="mdi-account-group" :title="t('dashboard.total_customers')" :value="stats.totalCustomers.toString()" color="primary" sub-icon="mdi-account-plus" sub-text="Active users" sub-icon-color="success" />
        </v-col>
        <v-col cols="12" sm="6" md="4" lg="2">
          <h-stats icon="mdi-package-variant" :title="t('dashboard.total_products')" :value="stats.totalProducts.toString()" color="success" sub-icon="mdi-tag" sub-text="Published" sub-icon-color="info" />
        </v-col>
        <v-col cols="12" sm="6" md="4" lg="2">
          <h-stats icon="mdi-clipboard-list" :title="t('dashboard.total_orders')" :value="stats.totalOrders.toString()" color="info" sub-icon="mdi-trending-up" sub-text="All time" sub-icon-color="success" />
        </v-col>
        <v-col cols="12" sm="6" md="4" lg="2">
          <h-stats icon="mdi-currency-usd" :title="t('dashboard.total_revenue')" :value="formatCurrency(stats.totalRevenue)" color="warning" sub-icon="mdi-chart-line" sub-text="Total earned" sub-icon-color="success" />
        </v-col>
        <v-col cols="12" sm="6" md="4" lg="2">
          <h-stats icon="mdi-clock-alert" :title="t('dashboard.pending_orders')" :value="stats.pendingOrders.toString()" color="error" sub-icon="mdi-alert" sub-text="Needs attention" sub-icon-color="warning" />
        </v-col>
        <v-col cols="12" sm="6" md="4" lg="2">
          <h-stats icon="mdi-folder" title="Categories" :value="stats.totalCategories.toString()" color="secondary" sub-icon="mdi-check" sub-text="Active" sub-icon-color="success" />
        </v-col>
      </v-row>

      <!-- Charts Row 1 -->
      <v-row class="mb-6">
        <!-- Sales by Month Bar Chart -->
        <v-col cols="12" md="8">
          <v-card class="pa-4" rounded="lg" elevation="1" border>
            <v-card-title>
              <v-icon start>mdi-chart-bar</v-icon>
              {{ t("dashboard.sales_by_month") }}
            </v-card-title>
            <h-bar-chart v-if="salesByMonth.length > 1" :data="salesByMonth" height="300px" title="" />
            <div v-else class="text-center py-10 text-grey">No sales data available</div>
          </v-card>
        </v-col>

        <!-- Orders by Status Pie Chart -->
        <v-col cols="12" md="4">
          <v-card class="pa-4" rounded="lg" elevation="1" border>
            <v-card-title>
              <v-icon start>mdi-chart-pie</v-icon>
              {{ t("dashboard.orders_by_status") }}
            </v-card-title>
            <h-pie-chart v-if="ordersByStatus.length > 1" :data="ordersByStatus" height="300px" title="" />
            <div v-else class="text-center py-10 text-grey">No order data available</div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Charts Row 2 -->
      <v-row>
        <!-- Order Trend Line Chart -->
        <v-col cols="12" md="8">
          <v-card class="pa-4" rounded="lg" elevation="1" border>
            <v-card-title>
              <v-icon start>mdi-chart-line</v-icon>
              {{ t("dashboard.order_trend") }}
            </v-card-title>
            <h-line-chart v-if="orderTrend.length > 1" :data="orderTrend" height="300px" title="" />
            <div v-else class="text-center py-10 text-grey">No trend data available</div>
          </v-card>
        </v-col>

        <!-- Sales by Category Pie Chart -->
        <v-col cols="12" md="4">
          <v-card class="pa-4" rounded="lg" elevation="1" border>
            <v-card-title>
              <v-icon start>mdi-chart-donut</v-icon>
              {{ t("dashboard.sales_by_category") }}
            </v-card-title>
            <h-pie-chart v-if="salesByCategory.length > 1" :data="salesByCategory" height="300px" title="" rose />
            <div v-else class="text-center py-10 text-grey">No category data available</div>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>
