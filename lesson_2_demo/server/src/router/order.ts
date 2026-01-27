/**
 * Order Router
 *
 * Order management with status workflow.
 * Users can create orders and view their own, admin can manage all.
 */

import { init_router, Entity, oid_query, code } from 'hola-server';
import type { Elysia } from 'elysia';
import { ORDER_STATUS } from '../core/type.js';

// Session user type
interface SessionUser {
  id: string;
  name: string;
  role: string | null;
}

// Generate order number
const generateOrderNo = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

const router: Elysia = init_router({
  collection: 'order',
  creatable: true,
  readable: true,
  updatable: true,
  deleteable: true,
  primary_keys: ['orderNo'],
  ref_label: 'orderNo',
  roles: ['admin:*', 'user:cr'],
  user_field: 'customer',
  fields: [
    { name: 'orderNo', required: true, update: false, create: false },
    { name: 'customer', ref: 'customer', required: true, update: false },
    { name: 'items', type: 'array', required: true, update: false, search: false },
    { name: 'totalAmount', type: 'number', required: true, update: false, search: false },
    { name: 'status', type: 'order_status', default: ORDER_STATUS.PENDING },
    { name: 'shippedAt', type: 'date', create: false, search: false },
    { name: 'deliveredAt', type: 'date', create: false, search: false },
    { name: 'note', type: 'text', search: false },
  ],

  // Before create: generate order number
  before_create: async (...args: unknown[]) => {
    const data = args[1] as Record<string, unknown>;
    data.orderNo = generateOrderNo();
  },

  // Filter orders by user (non-admin sees only their orders)
  list_query: (...args: unknown[]) => {
    const ctx = args[2] as { store: { user?: SessionUser } };
    const isAdmin = ctx?.store?.user?.role === 'admin';
    if (!isAdmin && ctx?.store?.user?.id) {
      return { customer: ctx.store.user.id };
    }
    return {};
  },

  route: (router, meta) => {
    const entity = new Entity(meta);

    // Place order (from cart)
    router.post('/place', async (ctx: { body: Record<string, unknown>; store: { user?: SessionUser } }) => {
      if (!ctx.store?.user?.id) {
        return { code: code.NO_RIGHTS, err: 'Please login to place order' };
      }

      const { items, note } = ctx.body as { items?: Array<{ price?: number; quantity?: number }>; note?: string };

      if (!Array.isArray(items) || items.length === 0) {
        return { code: code.NO_PARAMS, err: 'Cart is empty' };
      }

      // Calculate total amount
      let totalAmount = 0;
      for (const item of items) {
        totalAmount += (item.price || 0) * (item.quantity || 1);
      }

      const order = await entity.create({
        orderNo: generateOrderNo(),
        customer: ctx.store.user.id,
        items,
        totalAmount,
        status: ORDER_STATUS.PENDING,
        note,
      });

      return { code: code.SUCCESS, data: order };
    });

    // Update order status (admin workflow)
    router.post('/status/:id', async (ctx: { params: { id: string }; body: Record<string, unknown> }) => {
      const id = ctx.params.id;
      const { status } = ctx.body as { status?: number };

      const order = await entity.find_by_oid(id);
      if (!order) {
        return { code: code.NOT_FOUND, err: 'Order not found' };
      }

      const updateData: Record<string, unknown> = { status };

      // Auto-set timestamp based on status
      if (status === ORDER_STATUS.SHIPPED) {
        updateData.shippedAt = new Date();
      } else if (status === ORDER_STATUS.DELIVERED) {
        updateData.deliveredAt = new Date();
      }

      const query = oid_query(id);
      if (query) {
        await entity.update(query, updateData);
      }
      return { code: code.SUCCESS };
    });

    // Get my orders (for current user)
    router.get('/my', async (ctx: { store: { user?: SessionUser } }) => {
      if (!ctx.store?.user?.id) {
        return { code: code.NO_RIGHTS, err: 'Please login' };
      }

      const orders = await entity.find_sort(
        { customer: ctx.store.user.id },
        { createdAt: -1 }
      );
      return { code: code.SUCCESS, data: orders };
    });

    // Cancel order (user can cancel pending orders)
    router.post('/cancel/:id', async (ctx: { params: { id: string }; store: { user?: SessionUser } }) => {
      const id = ctx.params.id;
      const isAdmin = ctx.store?.user?.role === 'admin';

      const order = await entity.find_by_oid(id);
      if (!order) {
        return { code: code.NOT_FOUND, err: 'Order not found' };
      }

      // Non-admin can only cancel their own pending orders
      if (!isAdmin) {
        if (order.customer.toString() !== ctx.store?.user?.id) {
          return { code: code.NO_RIGHTS, err: 'Not authorized' };
        }
        if (order.status !== ORDER_STATUS.PENDING) {
          return { code: code.NO_RIGHTS, err: 'Can only cancel pending orders' };
        }
      }

      const query = oid_query(id);
      if (query) {
        await entity.update(query, { status: ORDER_STATUS.CANCELLED });
      }
      return { code: code.SUCCESS };
    });
  },
});

export default router;
