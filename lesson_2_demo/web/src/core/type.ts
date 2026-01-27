/**
 * Custom Type Definitions for Lesson 3: Views Showcase
 * Client-side type definitions matching server types.
 */

import { registerType } from 'hola-web';
import type { TypeDefinition, SelectItem } from 'hola-web';

/**
 * Creates an int enum type with i18n support
 */
const createIntEnumType = (name: string, labels: string[], i18n_prefix: string = name): TypeDefinition => ({
  name,
  inputType: 'autocomplete',
  items: (ctx: unknown) => {
    const vue = ctx as { t: (key: string) => string };
    return labels.map((label, i): SelectItem => ({
      value: i,
      title: vue.t(`type.${i18n_prefix}_${label}`),
    }));
  },
  format: (value: unknown, t?: (key: string) => string): string => {
    if (value === undefined || value === null || value === '') return '';
    const label = labels[value as number];
    return label && t ? t(`type.${i18n_prefix}_${label}`) : '';
  },
});

/**
 * Register custom types for this application
 */
export const register_types = (): void => {
  registerType(createIntEnumType('role', ['admin', 'user']));
  registerType(createIntEnumType('customer_status', ['active', 'inactive']));
  registerType(createIntEnumType('product_status', ['draft', 'published', 'discontinued']));
  registerType(createIntEnumType('order_status', ['pending', 'paid', 'shipped', 'delivered', 'cancelled']));
};

// Customer/User roles
export const ROLE = {
  ADMIN: 0,
  USER: 1,
} as const;

// Role names for display
export const ROLE_NAMES: Record<number, string> = {
  [ROLE.ADMIN]: 'admin',
  [ROLE.USER]: 'user',
};

// Customer status
export const CUSTOMER_STATUS = {
  ACTIVE: 0,
  INACTIVE: 1,
} as const;

// Product status
export const PRODUCT_STATUS = {
  DRAFT: 0,
  PUBLISHED: 1,
  DISCONTINUED: 2,
} as const;

// Order status
export const ORDER_STATUS = {
  PENDING: 0,
  PAID: 1,
  SHIPPED: 2,
  DELIVERED: 3,
  CANCELLED: 4,
} as const;

// Order status labels
export const ORDER_STATUS_LABELS: Record<number, string> = {
  [ORDER_STATUS.PENDING]: 'Pending',
  [ORDER_STATUS.PAID]: 'Paid',
  [ORDER_STATUS.SHIPPED]: 'Shipped',
  [ORDER_STATUS.DELIVERED]: 'Delivered',
  [ORDER_STATUS.CANCELLED]: 'Cancelled',
};

// Order status colors
export const ORDER_STATUS_COLORS: Record<number, string> = {
  [ORDER_STATUS.PENDING]: 'warning',
  [ORDER_STATUS.PAID]: 'info',
  [ORDER_STATUS.SHIPPED]: 'primary',
  [ORDER_STATUS.DELIVERED]: 'success',
  [ORDER_STATUS.CANCELLED]: 'error',
};

// Product status labels
export const PRODUCT_STATUS_LABELS: Record<number, string> = {
  [PRODUCT_STATUS.DRAFT]: 'Draft',
  [PRODUCT_STATUS.PUBLISHED]: 'Published',
  [PRODUCT_STATUS.DISCONTINUED]: 'Discontinued',
};

// Rating values
export const RATING = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
} as const;

// TypeScript interfaces
export interface Category {
  _id: string;
  name: string;
  description?: string;
  icon?: string;
  active: boolean;
  sortOrder: number;
}

export interface Product {
  _id: string;
  name: string;
  description?: string;
  category: string | Category;
  price: number;
  stock: number;
  image?: string;
  status: number;
  rating: number;
  reviewCount: number;
  createdAt: string;
}

export interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: number;
  status: number;
}

export interface OrderItem {
  product: string | Product;
  name?: string;
  productName?: string;
  quantity: number;
  price: number;
}

export interface Order {
  _id: string;
  orderNo: string;
  customer: string | Customer;
  items: OrderItem[];
  totalAmount: number;
  status: number;
  shippedAt?: string;
  deliveredAt?: string;
  note?: string;
  createdAt: string;
}

export interface Review {
  _id: string;
  product: string | Product;
  customer: string | Customer;
  rating: number;
  comment?: string;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  product?: Product;
  quantity: number;
  price: number;
}

export interface DashboardStats {
  totalCustomers: number;
  totalProducts: number;
  totalOrders: number;
  totalCategories: number;
  totalRevenue: number;
  pendingOrders: number;
}
