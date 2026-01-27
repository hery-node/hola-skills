/**
 * Server Configuration for Lesson 3: Views Showcase
 *
 * E-Commerce demo with role-based access control.
 */

import type { Settings } from 'hola-server';

export const dev_mode = true;

export const settings: Settings = {
  // Axios settings for HTTP client
  axios: {
    retry: 3,
    retry_delay: 1000,
    proxy: null,
  },

  // Encryption settings - CHANGE IN PRODUCTION
  encrypt: {
    key: 'lesson3_secret_key',
  },

  // MongoDB connection settings
  mongo: {
    url: 'mongodb://127.0.0.1/lesson3_views',
    pool: 10,
  },

  // Logging configuration
  log: {
    col_log: 'log',
    log_level: 0,
    save_db: !dev_mode,
  },

  // Role definitions
  roles: [
    { name: 'admin', root: true },  // role value: 0 - Full access
    { name: 'user' },               // role value: 1 - Customer access
  ],

  // Server configuration
  server: {
    service_port: 3003,
    client_web_url: ['http://localhost:8083', 'http://localhost:8084', 'http://localhost:8085', 'http://localhost:8086'],
    keep_session: true,
    check_user: true,
    exclude_urls: [
      '/customer/login',
      '/customer/register',
      '/product/list',
      '/product/read',
      '/category/list',
      '/review/list',
      '/review/product',
      '/dashboard',
    ],
    session: {
      secret: 'lesson3_session_secret',
      cookie_max_age: 24 * 60 * 60 * 1000, // 24 hours
    },
    threshold: {
      max_download_size: 5000,
      body_limit: '10mb',
    },
    routes: ['router'],
  },
};
