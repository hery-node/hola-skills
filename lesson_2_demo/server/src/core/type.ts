/**
 * Custom Type Definitions for Lesson 3: Views Showcase
 *
 * Registers custom types for product status, order status, roles, etc.
 */

import { register_type, int_enum_type, register_schema_type } from 'hola-server';
import { t } from 'elysia';

// Customer/User roles
export const ROLE = {
  ADMIN: 0,
  USER: 1,
} as const;

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

// Rating values 1-5
export const RATING = {
  ONE: 1,
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
} as const;

export const register_types = (): void => {
  // Register validation types
  register_type(int_enum_type('role', Object.values(ROLE)));
  register_type(int_enum_type('customer_status', Object.values(CUSTOMER_STATUS)));
  register_type(int_enum_type('product_status', Object.values(PRODUCT_STATUS)));
  register_type(int_enum_type('order_status', Object.values(ORDER_STATUS)));
  register_type(int_enum_type('rating', Object.values(RATING)));

  // Register schema types for request body validation
  register_schema_type('role', () => t.Union([
    t.Literal(ROLE.ADMIN),
    t.Literal(ROLE.USER)
  ]));
  register_schema_type('customer_status', () => t.Union([
    t.Literal(CUSTOMER_STATUS.ACTIVE),
    t.Literal(CUSTOMER_STATUS.INACTIVE)
  ]));
  register_schema_type('product_status', () => t.Union([
    t.Literal(PRODUCT_STATUS.DRAFT),
    t.Literal(PRODUCT_STATUS.PUBLISHED),
    t.Literal(PRODUCT_STATUS.DISCONTINUED)
  ]));
  register_schema_type('order_status', () => t.Union([
    t.Literal(ORDER_STATUS.PENDING),
    t.Literal(ORDER_STATUS.PAID),
    t.Literal(ORDER_STATUS.SHIPPED),
    t.Literal(ORDER_STATUS.DELIVERED),
    t.Literal(ORDER_STATUS.CANCELLED)
  ]));
  register_schema_type('rating', () => t.Union([
    t.Literal(RATING.ONE),
    t.Literal(RATING.TWO),
    t.Literal(RATING.THREE),
    t.Literal(RATING.FOUR),
    t.Literal(RATING.FIVE)
  ]));
};
