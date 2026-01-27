<script setup lang="ts">
/**
 * Product List View
 *
 * Browse products with grid/list view, filters, and search.
 * Showcases: DataTable, SearchForm, CardView, StatisticsView
 */
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { axiosGet, isSuccessResponse } from "hola-web";
import { useCart } from "@/composables/useCart";
import type { Product, Category } from "@/core/type";

// Router & i18n
const router = useRouter();
const { t } = useI18n();

// Cart
const { addToCart, getCartItem } = useCart();

// State
const loading = ref(false);
const products = ref<Product[]>([]);
const categories = ref<Category[]>([]);
const viewMode = ref<"grid" | "list">("grid");
const searchQuery = ref("");
const selectedCategory = ref<string | null>(null);
const snackbar = ref(false);
const snackbarMessage = ref("");

// Computed
const filteredProducts = computed(() => {
  let result = products.value;

  // Filter by category
  if (selectedCategory.value) {
    result = result.filter((p) => {
      const catId = typeof p.category === "string" ? p.category : p.category?._id;
      return catId === selectedCategory.value;
    });
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter((p) => p.name.toLowerCase().includes(query) || p.description?.toLowerCase().includes(query));
  }

  return result;
});

// Response types
interface ProductListResponse {
  code: number;
  data: Product[];
}

interface CategoryListResponse {
  code: number;
  data: Category[];
}

// Methods
const loadProducts = async () => {
  loading.value = true;
  const response = await axiosGet<ProductListResponse>("/product/list");
  if (isSuccessResponse(response.code)) {
    products.value = response.data || [];
  }
  loading.value = false;
};

const loadCategories = async () => {
  const response = await axiosGet<CategoryListResponse>("/category/list");
  if (isSuccessResponse(response.code)) {
    categories.value = response.data || [];
  }
};

const handleAddToCart = (product: Product) => {
  addToCart(product);
  snackbarMessage.value = `${product.name} added to cart`;
  snackbar.value = true;
};

const viewProduct = (product: Product) => {
  router.push({ name: "product-detail", params: { id: product._id } });
};

const formatPrice = (price: number) => {
  return `$${price.toFixed(2)}`;
};

const getCategoryName = (product: Product): string => {
  if (typeof product.category === "string") {
    const cat = categories.value.find((c) => c._id === product.category);
    return cat?.name || "Unknown";
  }
  return product.category?.name || "Unknown";
};

const isInCart = (productId: string): boolean => {
  return !!getCartItem(productId);
};

// Lifecycle
onMounted(() => {
  loadProducts();
  loadCategories();
});
</script>

<template>
  <v-container fluid>
    <!-- Header with Search and Filters -->
    <v-row class="mb-4">
      <v-col cols="12">
        <v-card class="pa-4" rounded="lg" elevation="1">
          <v-row align="center">
            <v-col cols="12" md="4">
              <v-text-field v-model="searchQuery" prepend-inner-icon="mdi-magnify" :label="t('common.search')" variant="outlined" density="compact" hide-details clearable />
            </v-col>
            <v-col cols="12" md="4">
              <v-select v-model="selectedCategory" :items="categories" item-title="name" item-value="_id" :label="t('product.category')" variant="outlined" density="compact" hide-details clearable />
            </v-col>
            <v-col cols="12" md="4" class="d-flex justify-end">
              <v-btn-toggle v-model="viewMode" mandatory variant="outlined" class="rounded-lg">
                <v-btn value="grid">
                  <v-icon>mdi-view-grid</v-icon>
                </v-btn>
                <v-btn value="list">
                  <v-icon>mdi-view-list</v-icon>
                </v-btn>
              </v-btn-toggle>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>

    <!-- Loading -->
    <v-row v-if="loading" justify="center">
      <v-col cols="12" class="text-center">
        <v-progress-circular indeterminate color="primary" size="60" />
      </v-col>
    </v-row>

    <!-- Grid View -->
    <v-row v-else-if="viewMode === 'grid'">
      <v-col v-for="product in filteredProducts" :key="product._id" cols="12" sm="6" md="4" lg="3">
        <v-card class="h-100 d-flex flex-column" hover @click="viewProduct(product)" rounded="lg" elevation="1" border>
          <v-img :src="product.image || 'https://picsum.photos/seed/default/400/300'" height="200" cover>
            <template #placeholder>
              <v-row class="fill-height ma-0" align="center" justify="center">
                <v-progress-circular indeterminate color="grey-lighten-5" />
              </v-row>
            </template>
            <v-chip v-if="product.stock === 0" class="ma-2" color="error" size="small">
              {{ t("product.out_of_stock") }}
            </v-chip>
          </v-img>

          <v-card-title class="text-truncate font-weight-bold pt-4">{{ product.name }}</v-card-title>

          <v-card-subtitle>
            <v-chip size="x-small" label color="primary" variant="tonal">{{ getCategoryName(product) }}</v-chip>
          </v-card-subtitle>

          <v-card-text class="flex-grow-1">
            <div class="d-flex align-center mb-2">
              <v-rating :model-value="product.rating" density="compact" size="small" half-increments readonly color="warning" />
              <span class="text-caption ml-1 text-medium-emphasis">({{ product.reviewCount }})</span>
            </div>
            <p class="text-body-2 text-truncate text-medium-emphasis">{{ product.description }}</p>
          </v-card-text>

          <v-divider></v-divider>

          <v-card-actions class="px-4 py-3">
            <span class="text-h6 text-primary font-weight-bold">{{ formatPrice(product.price) }}</span>
            <v-spacer />
            <v-btn :color="isInCart(product._id) ? 'success' : 'primary'" :variant="isInCart(product._id) ? 'tonal' : 'elevated'" size="small" rounded="pill" class="text-none px-4" elevation="0" :disabled="product.stock === 0" @click.stop="handleAddToCart(product)">
              <v-icon start>{{ isInCart(product._id) ? "mdi-check" : "mdi-cart-plus" }}</v-icon>
              {{ isInCart(product._id) ? "In Cart" : t("product.add_to_cart") }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- List View -->
    <v-row v-else>
      <v-col cols="12">
        <v-card rounded="lg" elevation="1" border>
          <v-list lines="three">
            <v-list-item v-for="product in filteredProducts" :key="product._id" @click="viewProduct(product)" link>
              <template #prepend>
                <v-avatar size="80" rounded class="mr-4">
                  <v-img :src="product.image || 'https://picsum.photos/seed/default/400/300'" cover />
                </v-avatar>
              </template>

              <v-list-item-title class="font-weight-bold text-h6 mb-1">
                {{ product.name }}
              </v-list-item-title>

              <v-list-item-subtitle class="mb-2">
                <v-chip size="x-small" label color="primary" variant="tonal" class="mr-2">{{ getCategoryName(product) }}</v-chip>
                <v-rating :model-value="product.rating" density="compact" size="x-small" half-increments readonly color="warning" />
                <span class="text-caption text-medium-emphasis">({{ product.reviewCount }})</span>
              </v-list-item-subtitle>

              <v-list-item-subtitle class="mt-1 text-body-2">
                {{ product.description }}
              </v-list-item-subtitle>

              <template #append>
                <div class="d-flex flex-column align-end justify-center h-100">
                  <span class="text-h6 text-primary font-weight-bold mb-2">{{ formatPrice(product.price) }}</span>
                  <v-btn :color="isInCart(product._id) ? 'success' : 'primary'" :variant="isInCart(product._id) ? 'tonal' : 'elevated'" size="small" rounded="pill" class="text-none" elevation="0" :disabled="product.stock === 0" @click.stop="handleAddToCart(product)">
                    <v-icon start>{{ isInCart(product._id) ? "mdi-check" : "mdi-cart-plus" }}</v-icon>
                  </v-btn>
                </div>
              </template>
            </v-list-item>
            <v-divider inset></v-divider>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <!-- Empty State -->
    <v-row v-if="!loading && filteredProducts.length === 0">
      <v-col cols="12" class="text-center">
        <v-icon size="100" color="grey-lighten-1">mdi-package-variant</v-icon>
        <p class="text-h6 text-grey mt-4">{{ t("common.no_data") }}</p>
      </v-col>
    </v-row>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :timeout="2000" color="success">
      {{ snackbarMessage }}
    </v-snackbar>
  </v-container>
</template>
