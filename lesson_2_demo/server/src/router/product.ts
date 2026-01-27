/**
 * Product Router
 *
 * CRUD operations for products.
 * Admin can create/update/delete, users can view published products.
 */

import { init_router, Entity, oid_query, code } from 'hola-server';
import type { Elysia } from 'elysia';
import { PRODUCT_STATUS } from '../core/type.js';

// Session user type
interface SessionUser {
  id: string;
  name: string;
  role: string | null;
}

const router: Elysia = init_router({
  collection: 'product',
  creatable: true,
  cloneable: true,
  readable: true,
  updatable: true,
  deleteable: true,
  primary_keys: ['name'],
  ref_label: 'name',
  roles: ['admin:*', 'user:r'],
  fields: [
    { name: 'name', required: true },
    { name: 'description', type: 'text', search: false },
    { name: 'category', ref: 'category', required: true },
    { name: 'price', type: 'number', required: true },
    { name: 'stock', type: 'number', default: 0, search: false },
    { name: 'image', default: '/placeholder.jpg', search: false },
    { name: 'status', type: 'product_status', default: PRODUCT_STATUS.DRAFT },
    { name: 'rating', type: 'number', default: 0, update: false, create: false, search: false },
    { name: 'reviewCount', type: 'number', default: 0, update: false, create: false, search: false },
  ],

  // Only show published products to non-admin users in list
  list_query: (...args: unknown[]) => {
    const ctx = args[2] as { store: { user?: SessionUser } };
    const isAdmin = ctx?.store?.user?.role === 'admin';
    if (!isAdmin) {
      return { status: PRODUCT_STATUS.PUBLISHED };
    }
    return {};
  },

  route: (router, meta) => {
    const entity = new Entity(meta);

    // Simple GET list for public product browsing
    router.get('/list', async (ctx: { store: { user?: SessionUser } }) => {
      const isAdmin = ctx.store?.user?.role === 'admin';
      const query: Record<string, unknown> = {};
      if (!isAdmin) {
        query.status = PRODUCT_STATUS.PUBLISHED;
      }
      const products = await entity.find(query);
      return { code: code.SUCCESS, data: products };
    });

    // GET single product by ID
    router.get('/read/:id', async (ctx: { params: { id: string } }) => {
      const id = ctx.params.id;
      const query = oid_query(id);
      if (!query) {
        return { code: code.SUCCESS, data: null };
      }
      const product = await entity.find_one(query);
      return { code: code.SUCCESS, data: product };
    });

    // Publish product (admin only)
    router.post('/publish/:id', async (ctx: { params: { id: string } }) => {
      const id = ctx.params.id;
      const query = oid_query(id);
      if (query) {
        await entity.update(query, { status: PRODUCT_STATUS.PUBLISHED });
      }
      return { code: code.SUCCESS };
    });

    // Unpublish product (admin only)
    router.post('/unpublish/:id', async (ctx: { params: { id: string } }) => {
      const id = ctx.params.id;
      const query = oid_query(id);
      if (query) {
        await entity.update(query, { status: PRODUCT_STATUS.DRAFT });
      }
      return { code: code.SUCCESS };
    });

    // Discontinue product (admin only)
    router.post('/discontinue/:id', async (ctx: { params: { id: string } }) => {
      const id = ctx.params.id;
      const query = oid_query(id);
      if (query) {
        await entity.update(query, { status: PRODUCT_STATUS.DISCONTINUED });
      }
      return { code: code.SUCCESS };
    });

    // Get products by category (public)
    router.get('/by-category/:categoryId', async (ctx: { params: { categoryId: string }; store: { user?: SessionUser } }) => {
      const { categoryId } = ctx.params;
      const isAdmin = ctx.store?.user?.role === 'admin';
      const query: Record<string, unknown> = { category: categoryId };
      if (!isAdmin) {
        query.status = PRODUCT_STATUS.PUBLISHED;
      }
      const products = await entity.find(query);
      return { code: code.SUCCESS, data: products };
    });
  },
});

export default router;
