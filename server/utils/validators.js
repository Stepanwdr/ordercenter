import { z } from 'zod';

const roleSchema = z.enum(['admin', 'courier', 'customer', 'operator']);
const orderStatusSchema = z.enum(['pending', 'accepted', 'cooking', 'ready', 'delivering', 'completed']);
export const courierStatuses= ['atRestaurant','pickedUp','enRoute','delivered','free','dayOff','offline','busy']
const courierStatusSchema = z.enum(courierStatuses);

export const OrderPaymentMethod = ['CASH' , 'ONLINE' , 'BANK POS' , 'IDRAM'];
export const OrderStatus = ['pending','accepted','cooking','ready','picked_up','delivering','completed','cancelled'];

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
          address: z.string().min(1).max(128).optional(),
          comment: z.string().optional(),
        })
      )
    ).optional(),
  }),
  updateRestaurant: z.object({
    name: z.string().min(2).max(255).optional(),
    photo: z.union([
      z.string().url(),
      z.null()
    ]).optional(),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
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
          address: z.string().min(1).max(128).optional(),
          comment: z.string().optional(),
        })
      )
    ).optional(),
  }),
  createOrder: z.object({
    price: z.coerce.number().positive(),
    restaurantId: z.string().uuid(),
    courierId: z.string().uuid().optional(),
    customerPhone: z.string().min(1).max(32).optional(),
    deliveryAddress: z.string().min(1).max(512).optional(),
    entrance: z.string().min(0).max(32).optional(),
    floor: z.string().min(0).max(32).optional(),
    domofon: z.string().min(0).max(64).optional(),
    home: z.string().min(0).max(128).optional(),
    addressComment: z.string().max(512).optional(),
    customerName: z.string().min(1).max(255).optional(),
    orderType: z.enum(['dine_in', 'takeaway', 'delivery']).optional(),
    city:z.string().min(0).max(128).optional(),
    street:z.string().min(0).max(128).optional(),
    building:z.string().min(0).max(32).optional(),
    apartment:z.string().min(0).max(32).optional(),
    prepTime:z.string().min(0).max(32).optional(),
    orderItems: z.array(
      z.object({
        menuItemId: z.string().min(1).max(128),
        quantity: z.number().min(1),
        price: z.number().min(0),
      })
    )
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
  updateMenu: z.object({
    name: z.string().min(2).max(255),
  }),
  createMenuItem: z.object({
    name: z.string().min(1).max(255),
    price: z.coerce.number().nonnegative().default(0),
    description: z.string().optional(),
    image: z.string().url().optional(),
    categoryId: z.string().uuid(),
    quantity: z.coerce.number().int().min(1).default(1),
    volumeValue: z.coerce.number().positive().optional(),
    volumeName: z.string().min(1).max(32).optional(),
  }),
  createCategory: z.object({
    name: z.string().min(2).max(128),
    slug: z.string().min(2).max(128).optional(),
  }),
  createCourier: z.object({
    name: z.string().min(1).optional(),
    phone: z.string().min(2).optional(),
    status: z.enum(courierStatuses).optional(),
    lat: z.coerce.number().optional(),
    lng: z.coerce.number().optional(),
    email: z.string().email(),
    restaurantId: z.string().uuid(),
    telegramId: z.string().optional(),
  }),
  updateCourier: z.object({
    name: z.string().min(1).optional(),
    phone: z.string().min(2).optional(),
    status: z.enum(courierStatuses).optional(),
    lat: z.coerce.number().optional(),
    lng: z.coerce.number().optional(),
    email: z.string().email(),
    restaurantId: z.string().uuid(),
    telegramId: z.string().optional(),
  }),
};

export const parseSchema = (schema, payload) => schema.parse(payload);
