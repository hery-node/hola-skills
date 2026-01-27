/**
 * Shopping Cart Composable
 *
 * Manages shopping cart state using localStorage.
 */

import { ref, computed, watch } from 'vue';
import type { CartItem, Product } from '@/core/type';

const CART_STORAGE_KEY = 'lesson3_cart';

// Load cart from localStorage
const loadCart = (): CartItem[] => {
  try {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

// Save cart to localStorage
const saveCart = (items: CartItem[]): void => {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
};

// Shared reactive cart state
const cartItems = ref<CartItem[]>(loadCart());

// Watch for changes and persist
watch(cartItems, (newItems) => {
  saveCart(newItems);
}, { deep: true });

export function useCart() {
  // Computed properties
  const itemCount = computed(() => {
    return cartItems.value.reduce((sum, item) => sum + item.quantity, 0);
  });

  const totalAmount = computed(() => {
    return cartItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0);
  });

  const isEmpty = computed(() => cartItems.value.length === 0);

  // Methods
  const addToCart = (product: Product, quantity = 1): void => {
    const existingIndex = cartItems.value.findIndex(
      (item) => item.productId === product._id
    );

    if (existingIndex >= 0) {
      cartItems.value[existingIndex].quantity += quantity;
    } else {
      cartItems.value.push({
        productId: product._id,
        product,
        quantity,
        price: product.price,
      });
    }
  };

  const removeFromCart = (productId: string): void => {
    const index = cartItems.value.findIndex((item) => item.productId === productId);
    if (index >= 0) {
      cartItems.value.splice(index, 1);
    }
  };

  const updateQuantity = (productId: string, quantity: number): void => {
    const item = cartItems.value.find((item) => item.productId === productId);
    if (item) {
      if (quantity <= 0) {
        removeFromCart(productId);
      } else {
        item.quantity = quantity;
      }
    }
  };

  const clearCart = (): void => {
    cartItems.value = [];
  };

  const getCartItem = (productId: string): CartItem | undefined => {
    return cartItems.value.find((item) => item.productId === productId);
  };

  // Prepare cart items for order placement (without product objects)
  const getOrderItems = (): Array<{ product: string; quantity: number; price: number; productName: string }> => {
    return cartItems.value.map((item) => ({
      product: item.productId,
      quantity: item.quantity,
      price: item.price,
      productName: item.product?.name || 'Unknown',
    }));
  };

  return {
    cartItems,
    itemCount,
    totalAmount,
    isEmpty,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartItem,
    getOrderItems,
  };
}
