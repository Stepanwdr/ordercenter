import { Order, OrderItem, MenuItem, Restaurant } from '../../models/index.js';

// Loads an order with the fields a kitchen needs and returns a channel-agnostic
// payload. Adapters map this into their own POS format (or send as-is to 'client').
export async function serializeOrderForKitchen(orderId) {
  const order = await Order.findByPk(orderId, {
    include: [
      { model: Restaurant, as: 'restaurant' },
      { model: OrderItem, as: 'orderItems', include: [{ model: MenuItem, as: 'menuItem' }] },
    ],
  });
  if (!order) return null;

  return {
    id: order.id,
    code: order.code,
    status: order.status,
    orderType: order.orderType,
    createdAt: order.createdAt,
    prepTime: order.prepTime,
    restaurant: order.restaurant ? { id: order.restaurant.id, name: order.restaurant.name } : null,
    customer: {
      name: order.customerName,
      phone: order.customerPhone,
    },
    delivery: {
      address: order.deliveryAddress,
      entrance: order.entrance,
      floor: order.floor,
      domofon: order.domofon,
      home: order.home,
      comment: order.addressComment,
      fee: Number(order.deliveryFee ?? 0),
    },
    payment: {
      method: order.payMethod,
      paid: order.paid,
    },
    items: (order.orderItems ?? []).map((it) => ({
      id: it.id,
      name: it.menuItem?.name ?? null,
      quantity: it.quantity,
      price: Number(it.price ?? 0),
    })),
    total: Number(order.price ?? 0),
  };
}
