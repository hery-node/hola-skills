<script setup lang="ts">
/**
 * Cart View
 *
 * Shopping cart with checkout.
 * Showcases: ArrayTable, ConfirmDialog
 */
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { axiosPost, isSuccessResponse } from "hola-web";
import { useCart } from "@/composables/useCart";

// Router & i18n
const router = useRouter();
const { t } = useI18n();

// Cart
const { cartItems, totalAmount, isEmpty, updateQuantity, removeFromCart, clearCart, getOrderItems } = useCart();

// State
const loading = ref(false);
const orderNote = ref("");
const snackbar = ref(false);
const snackbarMessage = ref("");
const snackbarColor = ref("success");
const confirmDialog = ref(false);
const itemToRemove = ref<string | null>(null);

// Computed
const formattedTotal = computed(() => `$${totalAmount.value.toFixed(2)}`);

// Response type
interface PlaceOrderResponse {
  code: number;
  data?: { _id: string; orderNo: string };
  err?: string;
}

// Methods
const formatPrice = (price: number) => `$${price.toFixed(2)}`;

const handleQuantityChange = (productId: string, newQuantity: number) => {
  if (newQuantity < 1) {
    itemToRemove.value = productId;
    confirmDialog.value = true;
  } else {
    updateQuantity(productId, newQuantity);
  }
};

const confirmRemove = (productId: string) => {
  itemToRemove.value = productId;
  confirmDialog.value = true;
};

const handleRemove = () => {
  if (itemToRemove.value) {
    removeFromCart(itemToRemove.value);
    itemToRemove.value = null;
  }
  confirmDialog.value = false;
};

const checkout = async () => {
  loading.value = true;

  const orderItems = getOrderItems();

  const response = await axiosPost<PlaceOrderResponse>("/order/place", {
    items: orderItems,
    note: orderNote.value,
  });

  if (isSuccessResponse(response.code)) {
    snackbarMessage.value = `Order ${response.data?.orderNo} placed successfully!`;
    snackbarColor.value = "success";
    clearCart();
    orderNote.value = "";

    // Navigate to order detail or my orders
    setTimeout(() => {
      router.push({ name: "my-orders" });
    }, 1500);
  } else {
    snackbarMessage.value = response.err || "Failed to place order";
    snackbarColor.value = "error";
  }

  snackbar.value = true;
  loading.value = false;
};

const continueShopping = () => {
  router.push({ name: "products" });
};
</script>

<template>
  <v-container>
    <h1 class="text-h4 mb-6">
      <v-icon start>mdi-cart</v-icon>
      {{ t("cart.title") }}
    </h1>

    <!-- Empty Cart -->
    <v-card v-if="isEmpty" class="text-center pa-10">
      <v-icon size="100" color="grey-lighten-1">mdi-cart-off</v-icon>
      <h2 class="text-h5 text-grey mt-4">{{ t("cart.empty") }}</h2>
      <v-btn color="primary" class="mt-6" @click="continueShopping">
        <v-icon start>mdi-shopping</v-icon>
        {{ t("cart.continue_shopping") }}
      </v-btn>
    </v-card>

    <!-- Cart Items -->
    <v-row v-else>
      <v-col cols="12" md="8">
        <v-card rounded="lg" elevation="1" border>
          <v-card-title class="py-3"> Cart Items ({{ cartItems.length }}) </v-card-title>
          <v-divider />

          <v-list lines="three" class="py-0">
            <v-list-item v-for="item in cartItems" :key="item.productId" class="py-3">
              <template #prepend>
                <v-avatar size="80" rounded="lg" class="mr-4">
                  <v-img :src="item.product?.image || 'https://picsum.photos/seed/default/100/100'" cover />
                </v-avatar>
              </template>

              <v-list-item-title class="font-weight-bold text-h6 mb-1">
                {{ item.product?.name || "Product" }}
              </v-list-item-title>

              <v-list-item-subtitle class="text-body-2 mb-2"> {{ formatPrice(item.price) }} / unit </v-list-item-subtitle>

              <div class="mt-2">
                <v-row align="center" no-gutters>
                  <v-col cols="auto">
                    <v-btn icon size="small" variant="tonal" color="primary" @click="handleQuantityChange(item.productId, item.quantity - 1)">
                      <v-icon>mdi-minus</v-icon>
                    </v-btn>
                  </v-col>
                  <v-col cols="auto" class="mx-4">
                    <span class="text-h6 font-weight-bold">{{ item.quantity }}</span>
                  </v-col>
                  <v-col cols="auto">
                    <v-btn icon size="small" variant="tonal" color="primary" @click="handleQuantityChange(item.productId, item.quantity + 1)">
                      <v-icon>mdi-plus</v-icon>
                    </v-btn>
                  </v-col>
                </v-row>
              </div>

              <template #append>
                <div class="d-flex flex-column align-end justify-space-between h-100">
                  <span class="text-h6 text-primary font-weight-bold">
                    {{ formatPrice(item.price * item.quantity) }}
                  </span>
                  <v-btn icon variant="text" color="grey" size="small" class="mt-4" @click="confirmRemove(item.productId)">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </div>
              </template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>

      <!-- Order Summary -->
      <v-col cols="12" md="4">
        <v-card class="pa-6" rounded="lg" elevation="1" border>
          <v-card-title class="px-0 pt-0 pb-4 text-h5 font-weight-bold">Order Summary</v-card-title>
          <v-divider class="mb-4" />

          <div class="d-flex justify-space-between mb-3 text-body-2 text-medium-emphasis">
            <span>{{ t("cart.subtotal") }}</span>
            <span class="text-high-emphasis">{{ formattedTotal }}</span>
          </div>
          <div class="d-flex justify-space-between mb-3 text-body-2 text-medium-emphasis">
            <span>Shipping</span>
            <span class="text-success font-weight-bold">Free</span>
          </div>
          <v-divider class="my-4" />
          <div class="d-flex justify-space-between mb-6 align-center">
            <span class="text-h6">{{ t("cart.total") }}</span>
            <span class="text-h4 text-primary font-weight-bold">{{ formattedTotal }}</span>
          </div>

          <v-textarea v-model="orderNote" label="Order Note (optional)" variant="outlined" rows="2" class="mb-6" color="primary" />

          <v-btn color="primary" size="large" block :loading="loading" class="rounded-pill mb-2" elevation="2" @click="checkout">
            <v-icon start>mdi-check</v-icon>
            {{ t("cart.checkout") }}
          </v-btn>

          <v-btn variant="text" block class="text-none" @click="continueShopping">
            {{ t("cart.continue_shopping") }}
          </v-btn>
        </v-card>
      </v-col>
    </v-row>

    <!-- Confirm Remove Dialog -->
    <v-dialog v-model="confirmDialog" max-width="400">
      <v-card>
        <v-card-title>Remove Item</v-card-title>
        <v-card-text> Are you sure you want to remove this item from your cart? </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="confirmDialog = false">
            {{ t("common.cancel") }}
          </v-btn>
          <v-btn color="error" variant="elevated" @click="handleRemove">
            {{ t("cart.remove") }}
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
