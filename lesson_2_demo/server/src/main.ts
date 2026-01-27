/**
 * Main Entry Point for Lesson 3: Views Showcase
 *
 * E-Commerce demo with full CRUD and role-based access control.
 */

import { Elysia } from 'elysia';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { plugins, init_settings, gen_i18n, Entity, get_entity_meta, get_type, init_db, validate_all_metas } from 'hola-server';
import { register_types, ROLE, CUSTOMER_STATUS, PRODUCT_STATUS } from './core/type.js';
import { settings, dev_mode } from './setting.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize settings and register custom types BEFORE importing routers
init_settings(settings);
register_types();

// Dynamic import routers AFTER types are registered
const customerRouter = (await import('./router/customer.js')).default;
const categoryRouter = (await import('./router/category.js')).default;
const productRouter = (await import('./router/product.js')).default;
const orderRouter = (await import('./router/order.js')).default;
const reviewRouter = (await import('./router/review.js')).default;
const dashboardRouter = (await import('./router/dashboard.js')).default;

validate_all_metas();

const app = new Elysia()
  .use(plugins.holaCors({ origin: settings.server.client_web_url }))
  .use(plugins.holaBody({ limit: settings.server.threshold.body_limit }))
  .use(plugins.holaAuth({ secret: settings.server.session.secret, excludeUrls: settings.server.exclude_urls }))
  .use(plugins.holaError())
  .use(customerRouter)
  .use(categoryRouter)
  .use(productRouter)
  .use(orderRouter)
  .use(reviewRouter)
  .use(dashboardRouter)
  .onStart(async () => {
    // Initialize database connection
    await init_db();

    if (dev_mode) {
      gen_i18n(__dirname + '/../../web/src/locales/en.json', true);
    }

    // Initialize seed data
    await seedData();

    console.log(`Lesson 3 server started on port ${settings.server.service_port}`);
  })
  .listen(settings.server.service_port);

// Seed initial data
async function seedData(): Promise<void> {
  const customerMeta = get_entity_meta('customer');
  if (!customerMeta) {
    console.error('Customer entity not found');
    return;
  }

  const customerEntity = new Entity(customerMeta);
  const adminPwd = get_type('password').convert('admin123')['value'];
  const userPwd = get_type('password').convert('user123')['value'];

  const customers = [
    { name: 'Admin', email: 'admin@demo.com', password: adminPwd, role: ROLE.ADMIN, status: CUSTOMER_STATUS.ACTIVE },
    { name: 'John Doe', email: 'john@demo.com', password: userPwd, role: ROLE.USER, status: CUSTOMER_STATUS.ACTIVE, phone: '123-456-7890', address: '123 Main St, City' },
  ];

  for (const customer of customers) {
    await customerEntity.update({ email: customer.email }, customer);
  }

  const categoryMeta = get_entity_meta('category');
  if (!categoryMeta) return;

  const categoryEntity = new Entity(categoryMeta);
  const categories = [
    { name: 'Electronics', description: 'Electronic devices and gadgets', icon: 'mdi-laptop', active: true, sortOrder: 1 },
    { name: 'Clothing', description: 'Fashion and apparel', icon: 'mdi-tshirt-crew', active: true, sortOrder: 2 },
    { name: 'Books', description: 'Books and publications', icon: 'mdi-book-open-variant', active: true, sortOrder: 3 },
    { name: 'Home & Garden', description: 'Home improvement and garden supplies', icon: 'mdi-home', active: true, sortOrder: 4 },
    { name: 'Sports', description: 'Sports equipment and accessories', icon: 'mdi-basketball', active: true, sortOrder: 5 },
    { name: 'Toys', description: 'Toys and games', icon: 'mdi-teddy-bear', active: true, sortOrder: 6 },
  ];

  const categoryIds: Record<string, string> = {};
  for (const category of categories) {
    await categoryEntity.update({ name: category.name }, category);
    const result = await categoryEntity.find_one({ name: category.name });
    if (result?._id) {
      categoryIds[category.name] = result._id.toString();
    }
  }

  const productMeta = get_entity_meta('product');
  if (!productMeta) return;

  const productEntity = new Entity(productMeta);
  const products = [
    { name: 'Laptop Pro 15', description: 'High-performance laptop', category: categoryIds['Electronics'], price: 1299.99, stock: 50, status: PRODUCT_STATUS.PUBLISHED, image: 'https://picsum.photos/seed/laptop/400/300' },
    { name: 'Wireless Mouse', description: 'Ergonomic wireless mouse', category: categoryIds['Electronics'], price: 29.99, stock: 200, status: PRODUCT_STATUS.PUBLISHED, image: 'https://picsum.photos/seed/mouse/400/300' },
    { name: 'Classic T-Shirt', description: 'Comfortable cotton t-shirt', category: categoryIds['Clothing'], price: 24.99, stock: 500, status: PRODUCT_STATUS.PUBLISHED, image: 'https://picsum.photos/seed/tshirt/400/300' },
    { name: 'TypeScript Handbook', description: 'Complete guide to TypeScript', category: categoryIds['Books'], price: 39.99, stock: 100, status: PRODUCT_STATUS.PUBLISHED, image: 'https://picsum.photos/seed/typescript/400/300' },
  ];

  for (const product of products) {
    await productEntity.update({ name: product.name }, product);
  }

  console.log('Seed data initialized');
}

export type App = typeof app;
