import { z } from 'zod';

const roleSchema = z.enum(['admin', 'courier', 'customer', 'operator']);
const orderStatusSchema = z.enum(['pending', 'accepted', 'cooking', 'ready', 'delivering', 'completed']);
const courierStatusSchema = z.enum(['offline', 'available', 'busy']);

export const schemas = {
  register: z.object({
    email: z.string().email(),
    password: z.string().min(8).max(72),
    role: roleSchema.default('customer'),
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
    ownerId: z.string().uuid().optional(),
    lat: z.coerce.number().min(-90).max(90),
    lng: z.coerce.number().min(-180).max(180),
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
};

export const parseSchema = (schema, payload) => schema.parse(payload);
