/**
 * Customer Router
 *
 * Customer management with authentication.
 * Supports login, register, and profile management.
 */

import { init_router, get_type, Entity, is_root_role, oid_query, code } from 'hola-server';
import type { Elysia } from 'elysia';
import { CUSTOMER_STATUS, ROLE } from '../core/type.js';
import { settings } from '../setting.js';

// Session user type
interface SessionUser {
  id: string;
  name: string;
  role: string | null;
}

// Convert role integer to role name
const get_role_name = (role_int: number): string | null => {
  if (!settings.roles || role_int < 0 || role_int >= settings.roles.length) return null;
  return settings.roles[role_int].name;
};

const router: Elysia = init_router({
  collection: 'customer',
  creatable: true,
  cloneable: true,
  readable: true,
  updatable: true,
  deleteable: true,
  primary_keys: ['email'],
  ref_label: 'name',
  roles: ['admin:*', 'user:ru'],
  fields: [
    { name: 'name', required: true },
    { name: 'email', required: true },
    { name: 'password', type: 'password', required: true, secure: true, list: false, search: false, view: '1' },
    { name: 'phone', search: false },
    { name: 'address', type: 'text', search: false },
    { name: 'role', type: 'role', default: ROLE.USER },
    { name: 'status', type: 'customer_status', default: CUSTOMER_STATUS.ACTIVE },
  ],

  route: (router, meta) => {
    const entity = new Entity(meta);

    // Login
    router.post('/login', async (ctx: { body: Record<string, unknown>; store: { user?: SessionUser }; accessJwt: { sign: (payload: Record<string, unknown>) => Promise<string> }; cookie: Record<string, { set: (opts: Record<string, unknown>) => void }> }) => {
      const { email, password } = ctx.body as { email?: string; password?: string };
      if (!email || !password) {
        return { code: code.NO_PARAMS, err: '[email,password] checking params are failed!' };
      }

      const encrypted_password = get_type('password').convert(password)['value'];
      const customer = await entity.find_one(
        { email, password: encrypted_password },
        { _id: 1, name: 1, email: 1, role: 1, status: 1 }
      );

      if (customer && customer.status === CUSTOMER_STATUS.ACTIVE) {
        const role_name = get_role_name(customer.role);
        
        // Generate JWT token
        const token = await ctx.accessJwt.sign({
          sub: customer._id + '',
          role: role_name,
          name: customer.name
        });
        
        // Set cookie
        ctx.cookie.access_token.set({
          value: token,
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          path: '/'
        });
        
        ctx.store.user = { id: customer._id + '', name: customer.name, role: role_name };
        return {
          code: code.SUCCESS,
          role: role_name,
          root: is_root_role(role_name),
          user: { id: customer._id, name: customer.name, email: customer.email },
        };
      } else {
        return { code: code.NOT_FOUND, root: false, err: "Email and password don't match" };
      }
    });

    // Register (public)
    router.post('/register', async (ctx: { body: Record<string, unknown>; store: { user?: SessionUser }; accessJwt: { sign: (payload: Record<string, unknown>) => Promise<string> }; cookie: Record<string, { set: (opts: Record<string, unknown>) => void }> }) => {
      const { name, email, password } = ctx.body as { name?: string; email?: string; password?: string };
      if (!name || !email || !password) {
        return { code: code.NO_PARAMS, err: '[name,email,password] are required!' };
      }

      // Check if email already exists
      const existing = await entity.find_one({ email });
      if (existing) {
        return { code: code.DUPLICATE_KEY, err: 'Email already registered' };
      }

      const encrypted_password = get_type('password').convert(password)['value'];
      const customer = await entity.create({
        name,
        email,
        password: encrypted_password,
        role: ROLE.USER,
        status: CUSTOMER_STATUS.ACTIVE,
      });

      const role_name = get_role_name(ROLE.USER);
      
      // Generate JWT token
      const token = await ctx.accessJwt.sign({
        sub: customer._id + '',
        role: role_name,
        name: customer.name
      });
      
      // Set cookie
      ctx.cookie.access_token.set({
        value: token,
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        path: '/'
      });
      
      ctx.store.user = { id: customer._id + '', name: customer.name, role: role_name };

      return {
        code: code.SUCCESS,
        role: role_name,
        root: false,
        user: { id: customer._id, name: customer.name, email: customer.email },
      };
    });

    // Get current user role
    router.get('/role', (ctx: { user?: { sub: string; role?: string; name?: string } }) => {
      const role = ctx.user?.role ?? null;
      const user = ctx.user
        ? { id: ctx.user.sub, name: ctx.user.name }
        : null;
      return { code: code.SUCCESS, role, user };
    });

    // Get current user profile
    router.get('/profile', async (ctx: { store: { user?: SessionUser } }) => {
      if (!ctx.store.user) {
        return { code: code.NOT_FOUND, err: 'Not logged in' };
      }
      const customer = await entity.find_by_oid(ctx.store.user.id, {
        name: 1,
        email: 1,
        phone: 1,
        address: 1,
      });
      return { code: code.SUCCESS, data: customer };
    });

    // Update profile
    router.post('/profile', async (ctx: { body: Record<string, unknown>; store: { user?: SessionUser } }) => {
      if (!ctx.store.user) {
        return { code: code.NOT_FOUND, err: 'Not logged in' };
      }
      const { name, phone, address } = ctx.body as { name?: string; phone?: string; address?: string };
      const query = oid_query(ctx.store.user.id);
      if (query) {
        await entity.update(query, { name, phone, address });
      }
      return { code: code.SUCCESS };
    });

    // Logout
    router.get('/logout', (ctx: { cookie: Record<string, { remove: () => void }> }) => {
      if (ctx.cookie?.access_token) ctx.cookie.access_token.remove();
      return { code: code.SUCCESS };
    });
  },
});

export default router;
