/**
 * Review Router
 *
 * Product reviews and ratings.
 * Users can create reviews for products they've ordered.
 */

import { init_router, Entity, get_entity_meta, oid_query, oid_queries, code } from 'hola-server';
import type { Elysia } from 'elysia';

// Session user type
interface SessionUser {
  id: string;
  name: string;
  role: string | null;
}

// Store product IDs before delete to update ratings after
let pendingProductIds: string[] = [];

const router: Elysia = init_router({
  collection: 'review',
  creatable: true,
  readable: true,
  updatable: true,
  deleteable: true,
  primary_keys: ['product', 'customer'],
  ref_label: 'comment',
  roles: ['admin:*', 'user:crud'],
  user_field: 'customer',
  fields: [
    { name: 'product', ref: 'product', required: true, update: false },
    { name: 'customer', ref: 'customer', required: true, update: false },
    { name: 'rating', type: 'rating', required: true },
    { name: 'comment', type: 'text' },
  ],

  // After create: update product rating
  after_create: async (...args: unknown[]) => {
    const data = args[1] as Record<string, unknown>;
    await updateProductRating(data.product as string);
  },

  // After update: update product rating
  after_update: async (...args: unknown[]) => {
    const data = args[2] as Record<string, unknown>;
    if (data.product) {
      await updateProductRating(data.product as string);
    }
  },

  // Before delete: capture product IDs
  before_delete: async (...args: unknown[]) => {
    const entity = args[0] as Entity;
    const id_array = args[1] as string[];
    const query = oid_queries(id_array);
    if (query) {
      const reviews = await entity.find(query, { product: 1 });
      pendingProductIds = [...new Set(reviews.map((r: Record<string, unknown>) => r.product as string))];
    }
  },

  // After delete: update product ratings
  after_delete: async () => {
    for (const productId of pendingProductIds) {
      await updateProductRating(productId);
    }
    pendingProductIds = [];
  },

  route: (router, meta) => {
    const entity = new Entity(meta);

    // Get reviews for a product
    router.get('/product/:productId', async (ctx: { params: { productId: string } }) => {
      const { productId } = ctx.params;
      const reviews = await entity.find_sort(
        { product: productId },
        { createdAt: -1 }
      );
      return { code: code.SUCCESS, data: reviews };
    });

    // Add review (check if user already reviewed)
    router.post('/add', async (ctx: { body: Record<string, unknown>; store: { user?: SessionUser } }) => {
      if (!ctx.store?.user?.id) {
        return { code: code.NO_RIGHTS, err: 'Please login to review' };
      }

      const { product, rating, comment } = ctx.body as { product?: string; rating?: number; comment?: string };

      // Check if already reviewed
      const existing = await entity.find_one({
        product,
        customer: ctx.store.user.id,
      });

      if (existing) {
        return { code: code.DUPLICATE_KEY, err: 'You already reviewed this product' };
      }

      const review = await entity.create({
        product,
        customer: ctx.store.user.id,
        rating,
        comment,
      });

      // Update product rating
      await updateProductRating(product as string);

      return { code: code.SUCCESS, data: review };
    });

    // Get my review for a product
    router.get('/my/:productId', async (ctx: { params: { productId: string }; store: { user?: SessionUser } }) => {
      if (!ctx.store?.user?.id) {
        return { code: code.NOT_FOUND, data: null };
      }

      const { productId } = ctx.params;
      const review = await entity.find_one({
        product: productId,
        customer: ctx.store.user.id,
      });

      return { code: code.SUCCESS, data: review };
    });
  },
});

// Helper function to update product rating
async function updateProductRating(productId: string): Promise<void> {
  const reviewMeta = get_entity_meta('review');
  const productMeta = get_entity_meta('product');

  if (!reviewMeta || !productMeta) return;

  const reviewEntity = new Entity(reviewMeta);
  const productEntity = new Entity(productMeta);

  const reviews = await reviewEntity.find({ product: productId });
  const reviewCount = reviews.length;

  let avgRating = 0;
  if (reviewCount > 0) {
    const totalRating = reviews.reduce((sum: number, r: Record<string, unknown>) => sum + ((r.rating as number) || 0), 0);
    avgRating = Math.round((totalRating / reviewCount) * 10) / 10;
  }

  const query = oid_query(productId);
  if (query) {
    await productEntity.update(query, {
      rating: avgRating,
      reviewCount,
    });
  }
}

export default router;
