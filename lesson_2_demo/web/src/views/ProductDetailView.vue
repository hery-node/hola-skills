<script setup lang="ts">
/**
 * Product Detail View
 *
 * Product details with reviews.
 * Showcases: PropertyTable, ArrayTable (reviews), Rating
 */
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { axiosGet, axiosPost, isSuccessResponse } from "hola-web";
import { useCart } from "@/composables/useCart";
import type { Product, Review, Category } from "@/core/type";

// Route & Router & i18n
const route = useRoute();
const router = useRouter();
const { t } = useI18n();

// Cart
const { addToCart, getCartItem } = useCart();

// State
const loading = ref(false);
const product = ref<Product | null>(null);
const reviews = ref<Review[]>([]);
const quantity = ref(1);
const snackbar = ref(false);
const snackbarMessage = ref("");
const snackbarColor = ref("success");

// Review form
const showReviewDialog = ref(false);
const reviewRating = ref(5);
const reviewComment = ref("");
const submittingReview = ref(false);
const myReview = ref<Review | null>(null);

// Computed
const productId = computed(() => route.params.id as string);
const isInCart = computed(() => !!getCartItem(productId.value));
const categoryName = computed(() => {
  if (!product.value) return "";
  if (typeof product.value.category === "string") return "";
  return (product.value.category as Category)?.name || "";
});

// Response types
interface ProductResponse {
  code: number;
  data: Product;
}

interface ReviewListResponse {
  code: number;
  data: Review[];
}

interface ReviewResponse {
  code: number;
  data?: Review;
  err?: string;
}

// Methods
const loadProduct = async () => {
  loading.value = true;
  const response = await axiosGet<ProductResponse>(`/product/read/${productId.value}`);
  if (isSuccessResponse(response.code)) {
    product.value = response.data;
  }
  loading.value = false;
};

const loadReviews = async () => {
  const response = await axiosGet<ReviewListResponse>(`/review/product/${productId.value}`);
  if (isSuccessResponse(response.code)) {
    reviews.value = response.data || [];
  }
};

const loadMyReview = async () => {
  const response = await axiosGet<ReviewResponse>(`/review/my/${productId.value}`);
  if (isSuccessResponse(response.code) && response.data) {
    myReview.value = response.data;
  }
};

const handleAddToCart = () => {
  if (!product.value) return;
  addToCart(product.value, quantity.value);
  snackbarMessage.value = `${product.value.name} added to cart`;
  snackbarColor.value = "success";
  snackbar.value = true;
};

const submitReview = async () => {
  submittingReview.value = true;

  const response = await axiosPost<ReviewResponse>("/review/add", {
    product: productId.value,
    rating: reviewRating.value,
    comment: reviewComment.value,
  });

  if (isSuccessResponse(response.code) && !response.err) {
    snackbarMessage.value = "Review submitted successfully!";
    snackbarColor.value = "success";
    showReviewDialog.value = false;
    reviewComment.value = "";
    reviewRating.value = 5;
    loadReviews();
    loadProduct(); // Refresh rating
    loadMyReview();
  } else if (response.err === "authentication required") {
    router.push({ name: "login" });
    return;
  } else {
    snackbarMessage.value = response.err || "Failed to submit review";
    snackbarColor.value = "error";
  }

  snackbar.value = true;
  submittingReview.value = false;
};

const formatPrice = (price: number) => `$${price.toFixed(2)}`;

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString();
};

const goBack = () => {
  router.push({ name: "products" });
};

// Lifecycle
onMounted(() => {
  loadProduct();
  loadReviews();
  loadMyReview();
});
</script>

<template>
  <v-container>
    <!-- Back Button -->
    <v-btn variant="text" class="mb-4" @click="goBack">
      <v-icon start>mdi-arrow-left</v-icon>
      Back to Products
    </v-btn>

    <!-- Loading -->
    <v-row v-if="loading" justify="center">
      <v-col cols="12" class="text-center py-10">
        <v-progress-circular indeterminate color="primary" size="60" />
      </v-col>
    </v-row>

    <!-- Product Details -->
    <v-row v-else-if="product">
      <!-- Product Image -->
      <v-col cols="12" md="5">
        <v-card rounded="lg" elevation="1" border>
          <v-img :src="product.image || 'https://picsum.photos/seed/default/600/400'" height="400" cover />
        </v-card>
      </v-col>

      <!-- Product Info -->
      <v-col cols="12" md="7">
        <v-card class="pa-6" rounded="lg" elevation="1" border>
          <v-chip v-if="categoryName" label color="primary" variant="tonal" class="mb-2">
            {{ categoryName }}
          </v-chip>

          <h1 class="text-h4 mb-2">{{ product.name }}</h1>

          <div class="d-flex align-center mb-4">
            <v-rating :model-value="product.rating ?? 0" density="compact" half-increments readonly color="warning" />
            <span class="ml-2 text-body-1"> {{ (product.rating ?? 0).toFixed(1) }} ({{ product.reviewCount ?? 0 }} reviews) </span>
          </div>

          <p class="text-h3 text-primary mb-4">{{ formatPrice(product.price) }}</p>

          <p class="text-body-1 mb-6">{{ product.description }}</p>

          <!-- Stock Status -->
          <v-alert :type="product.stock > 0 ? 'success' : 'error'" variant="tonal" class="mb-6" density="comfortable" border="start">
            <template #prepend>
              <v-icon>{{ product.stock > 0 ? "mdi-check-circle" : "mdi-alert-circle" }}</v-icon>
            </template>
            {{ product.stock > 0 ? `In Stock (${product.stock} available)` : "Out of Stock" }}
          </v-alert>

          <!-- Quantity & Add to Cart -->
          <v-row v-if="product.stock > 0" align="center">
            <v-col cols="4">
              <v-text-field v-model.number="quantity" type="number" :min="1" :max="product.stock" label="Quantity" variant="outlined" density="compact" hide-details />
            </v-col>
            <v-col cols="8">
              <v-btn :color="isInCart ? 'success' : 'primary'" :variant="isInCart ? 'tonal' : 'elevated'" size="large" block class="rounded-pill text-none" elevation="2" @click="handleAddToCart">
                <v-icon start>{{ isInCart ? "mdi-check" : "mdi-cart-plus" }}</v-icon>
                {{ isInCart ? "Added to Cart" : t("product.add_to_cart") }}
              </v-btn>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>

    <!-- Reviews Section -->
    <v-row v-if="product" class="mt-6">
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon start>mdi-comment-text-multiple</v-icon>
            {{ t("product.reviews") }} ({{ reviews.length }})
            <v-spacer />
            <v-btn v-if="!myReview" color="primary" variant="elevated" @click="showReviewDialog = true">
              <v-icon start>mdi-pencil</v-icon>
              {{ t("review.write_review") }}
            </v-btn>
          </v-card-title>

          <v-divider />

          <v-card-text>
            <!-- My Review -->
            <v-alert v-if="myReview" type="info" variant="tonal" class="mb-4">
              <div class="d-flex align-center">
                <strong class="mr-2">Your Review:</strong>
                <v-rating :model-value="myReview.rating" density="compact" size="small" readonly color="warning" />
              </div>
              <p class="mt-2">{{ myReview.comment }}</p>
            </v-alert>

            <!-- Reviews List -->
            <v-list v-if="reviews.length > 0" lines="three">
              <v-list-item v-for="review in reviews" :key="review._id">
                <template #prepend>
                  <v-avatar color="primary">
                    <v-icon>mdi-account</v-icon>
                  </v-avatar>
                </template>

                <v-list-item-title class="d-flex align-center">
                  <span class="font-weight-bold mr-2">
                    {{ typeof review.customer === "object" ? review.customer.name : "Customer" }}
                  </span>
                  <v-rating :model-value="review.rating" density="compact" size="small" readonly color="warning" />
                </v-list-item-title>

                <v-list-item-subtitle>
                  {{ formatDate(review.createdAt) }}
                </v-list-item-subtitle>

                <v-list-item-subtitle class="mt-2">
                  {{ review.comment }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>

            <!-- No Reviews -->
            <div v-else class="text-center py-6">
              <v-icon size="60" color="grey-lighten-1">mdi-comment-outline</v-icon>
              <p class="text-grey mt-2">No reviews yet. Be the first to review!</p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Review Dialog -->
    <v-dialog v-model="showReviewDialog" max-width="500">
      <v-card>
        <v-card-title>{{ t("review.write_review") }}</v-card-title>
        <v-card-text>
          <div class="mb-4">
            <label class="text-body-2 mb-2 d-block">{{ t("review.your_rating") }}</label>
            <v-rating v-model="reviewRating" color="warning" hover size="large" />
          </div>
          <v-textarea v-model="reviewComment" :label="t('review.your_comment')" variant="outlined" rows="4" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="showReviewDialog = false">
            {{ t("common.cancel") }}
          </v-btn>
          <v-btn color="primary" variant="elevated" :loading="submittingReview" @click="submitReview">
            {{ t("review.submit") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="2000">
      {{ snackbarMessage }}
    </v-snackbar>
  </v-container>
</template>
