import { z } from 'zod';

const roleSchema = z.enum(['admin', 'courier', 'customer', 'operator']);
const orderStatusSchema = z.enum(['pending', 'accepted', 'cooking', 'ready', 'delivering', 'completed']);
const courierStatusSchema = z.enum(['offline', 'available', 'busy']);

export const schemas = {
  register: z.object({
    email: z.string().email(),
    password: z.string().min(8).max(72),
    role: roleSchema.default('operator'),
  }),
  login: z.object({
    email: z.string().email(),
    password: z.string().min(8).max(72),
  }),
  refreshToken: z.object({
    refreshToken: z.string().min(32),
  }),
  createRestaurant: z.object({
    name: z.string().min(2).max(255),
    photo: z.union([
      z.string().url(),
      z.null()
    ]).optional(),
    ownerId: z.string().uuid().optional(),
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180),
    phone: z.string().min(2).max(12).optional(),
    addresses: z.preprocess(
      (v) => {
        if (typeof v === 'string') {
          try {
            return JSON.parse(v);
          } catch {
            return [];
          }
        }
        return v;
      },
      z.array(
        z.object({
          city: z.string().min(1).max(128).optional(),
          street: z.string().min(1).max(256).optional(),
          building: z.string().optional(),
          apartment: z.string().optional(),
          comment: z.string().optional(),
        })
      )
    ).optional(),
  }),
  createOrder: z.object({
    price: z.coerce.number().positive(),
    customerId: z.string().uuid().optional(),
    restaurantId: z.string().uuid(),
  }),
  assignCourier: z.object({
    courierId: z.string().uuid(),
  }),
  updateOrderStatus: z.object({
    status: orderStatusSchema,
  }),
  updateCourierLocation: z.object({
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180),
    status: courierStatusSchema.optional(),
  }),
  createUser: z.object({
    email: z.string().email(),
    password: z.string().min(8).max(72),
    role: roleSchema,
  }),
  createMenu: z.object({
    name: z.string().min(2).max(255),
  }),
  createMenuItem: z.object({
    name: z.string().min(1).max(255),
    price: z.coerce.number().positive(),
    description: z.string().optional()
  }),
};

export const parseSchema = (schema, payload) => schema.parse(payload);
