/**
 * Category Router
 *
 * CRUD operations for product categories.
 * Admin-only management, public read access.
 */

import { init_router, Entity, code } from 'hola-server';
import type { Elysia } from 'elysia';

const router: Elysia = init_router({
  collection: 'category',
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
    { name: 'description', search: false },
    { name: 'icon', default: 'mdi-folder', search: false },
    { name: 'active', type: 'boolean', default: true },
    { name: 'sortOrder', type: 'number', default: 0, search: false },
  ],

  route: (router, meta) => {
    const entity = new Entity(meta);

    // Simple GET list for public category browsing
    router.get('/list', async () => {
      const categories = await entity.find({ active: true });
      return { code: code.SUCCESS, data: categories };
    });
  },
});

export default router;
