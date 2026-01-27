/**
 * Dashboard Router
 *
 * Statistics and analytics endpoints for admin dashboard.
 */

import { Elysia } from 'elysia';
import { Entity, get_entity_meta, code } from 'hola-server';
import { ORDER_STATUS, PRODUCT_STATUS } from '../core/type.js';

const router = new Elysia({ prefix: '/dashboard' });

// Get dashboard statistics
router.get('/stats', async () => {
  const customerMeta = get_entity_meta('customer');
  const productMeta = get_entity_meta('product');
  const orderMeta = get_entity_meta('order');
  const categoryMeta = get_entity_meta('category');

  if (!customerMeta || !productMeta || !orderMeta || !categoryMeta) {
    return { code: code.SUCCESS, data: {} };
  }

  const customerEntity = new Entity(customerMeta);
  const productEntity = new Entity(productMeta);
  const orderEntity = new Entity(orderMeta);
  const categoryEntity = new Entity(categoryMeta);

  // Count totals
  const totalCustomers = await customerEntity.count({});
  const totalProducts = await productEntity.count({ status: PRODUCT_STATUS.PUBLISHED });
  const totalOrders = await orderEntity.count({});
  const totalCategories = await categoryEntity.count({ active: true });

  // Calculate revenue (sum of delivered orders)
  const deliveredOrders = await orderEntity.find({ status: ORDER_STATUS.DELIVERED });
  const totalRevenue = deliveredOrders.reduce(
    (sum: number, order: Record<string, unknown>) => sum + ((order.totalAmount as number) || 0),
    0
  );

  // Pending orders count
  const pendingOrders = await orderEntity.count({ status: ORDER_STATUS.PENDING });

  return {
    code: code.SUCCESS,
    data: {
      totalCustomers,
      totalProducts,
      totalOrders,
      totalCategories,
      totalRevenue,
      pendingOrders,
    },
  };
});

// Get sales by month (for bar chart)
router.get('/sales-by-month', async () => {
  const orderMeta = get_entity_meta('order');
  if (!orderMeta) {
    return { code: code.SUCCESS, data: [] };
  }

  const orderEntity = new Entity(orderMeta);

  // Get orders from last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const orders = await orderEntity.find({
    createdAt: { $gte: sixMonthsAgo },
    status: { $in: [ORDER_STATUS.PAID, ORDER_STATUS.SHIPPED, ORDER_STATUS.DELIVERED] },
  });

  // Group by month
  const monthlyData: Record<string, number> = {};
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  orders.forEach((order: Record<string, unknown>) => {
    const date = new Date(order.createdAt as string | Date);
    const monthKey = `${months[date.getMonth()]} ${date.getFullYear()}`;
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + ((order.totalAmount as number) || 0);
  });

  // Convert to chart format
  const chartData = [['Month', 'Sales']];
  Object.entries(monthlyData).forEach(([month, sales]) => {
    chartData.push([month, sales as unknown as string]);
  });

  return { code: code.SUCCESS, data: chartData };
});

// Get orders by status (for pie chart)
router.get('/orders-by-status', async () => {
  const orderMeta = get_entity_meta('order');
  if (!orderMeta) {
    return { code: code.SUCCESS, data: [] };
  }

  const orderEntity = new Entity(orderMeta);

  const statusCounts = await Promise.all([
    orderEntity.count({ status: ORDER_STATUS.PENDING }),
    orderEntity.count({ status: ORDER_STATUS.PAID }),
    orderEntity.count({ status: ORDER_STATUS.SHIPPED }),
    orderEntity.count({ status: ORDER_STATUS.DELIVERED }),
    orderEntity.count({ status: ORDER_STATUS.CANCELLED }),
  ]);

  const chartData = [
    ['Status', 'Count'],
    ['Pending', statusCounts[0]],
    ['Paid', statusCounts[1]],
    ['Shipped', statusCounts[2]],
    ['Delivered', statusCounts[3]],
    ['Cancelled', statusCounts[4]],
  ];

  return { code: code.SUCCESS, data: chartData };
});

// Get sales by category (for pie chart)
router.get('/sales-by-category', async () => {
  const orderMeta = get_entity_meta('order');
  const productMeta = get_entity_meta('product');
  const categoryMeta = get_entity_meta('category');

  if (!orderMeta || !productMeta || !categoryMeta) {
    return { code: code.SUCCESS, data: [] };
  }

  const orderEntity = new Entity(orderMeta);
  const productEntity = new Entity(productMeta);
  const categoryEntity = new Entity(categoryMeta);

  // Get all categories
  const categories = await categoryEntity.find({});
  const categoryMap: Record<string, string> = {};
  categories.forEach((cat: Record<string, unknown>) => {
    const id = cat._id as { toString(): string };
    categoryMap[id.toString()] = cat.name as string;
  });

  // Get all products
  const products = await productEntity.find({});
  const productCategoryMap: Record<string, string> = {};
  products.forEach((prod: Record<string, unknown>) => {
    const id = prod._id as { toString(): string };
    const cat = prod.category as { toString(): string } | undefined;
    productCategoryMap[id.toString()] = cat?.toString() || '';
  });

  // Get completed orders
  const orders = await orderEntity.find({
    status: { $in: [ORDER_STATUS.PAID, ORDER_STATUS.SHIPPED, ORDER_STATUS.DELIVERED] },
  });

  // Aggregate sales by category
  const categorySales: Record<string, number> = {};
  orders.forEach((order: Record<string, unknown>) => {
    const items = order.items as Array<Record<string, unknown>> | undefined;
    items?.forEach((item: Record<string, unknown>) => {
      const productId = (item.product as { toString(): string })?.toString() || '';
      const categoryId = productCategoryMap[productId] || 'Unknown';
      const categoryName = categoryMap[categoryId] || 'Unknown';
      const amount = ((item.price as number) || 0) * ((item.quantity as number) || 1);
      categorySales[categoryName] = (categorySales[categoryName] || 0) + amount;
    });
  });

  const chartData = [['Category', 'Sales']];
  Object.entries(categorySales).forEach(([category, sales]) => {
    chartData.push([category, sales as unknown as string]);
  });

  return { code: code.SUCCESS, data: chartData };
});

// Get order trend (for line chart)
router.get('/order-trend', async () => {
  const orderMeta = get_entity_meta('order');
  if (!orderMeta) {
    return { code: code.SUCCESS, data: [] };
  }

  const orderEntity = new Entity(orderMeta);

  // Get orders from last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const orders = await orderEntity.find({
    createdAt: { $gte: thirtyDaysAgo },
  });

  // Group by day
  const dailyData: Record<string, { orders: number; revenue: number }> = {};

  orders.forEach((order: Record<string, unknown>) => {
    const date = new Date(order.createdAt as string | Date);
    const dayKey = `${date.getMonth() + 1}/${date.getDate()}`;
    if (!dailyData[dayKey]) {
      dailyData[dayKey] = { orders: 0, revenue: 0 };
    }
    dailyData[dayKey].orders++;
    dailyData[dayKey].revenue += (order.totalAmount as number) || 0;
  });

  const chartData = [['Date', 'Orders', 'Revenue']];
  Object.entries(dailyData).forEach(([day, data]) => {
    chartData.push([day, data.orders as unknown as string, data.revenue as unknown as string]);
  });

  return { code: code.SUCCESS, data: chartData };
});

export default router;
