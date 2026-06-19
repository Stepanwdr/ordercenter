import { Op } from 'sequelize';
import { Order, Restaurant } from '../../models/index.js';
import AppError from '../../utils/AppError.js';
import { getIo } from '../socket.js';
import { serializeOrderForKitchen } from './serializeOrder.js';
import { pushToRestaurant } from './kitchenStream.js';
import { clientAdapter } from './adapters/clientAdapter.js';
import { iikoAdapter } from './adapters/iikoAdapter.js';
import { rkeeperAdapter } from './adapters/rkeeperAdapter.js';

// Adapter registry (Strategy). Add a new POS == add an entry + an adapter module.
const ADAPTERS = {
  client: clientAdapter,
  iiko: iikoAdapter,
  rkeeper: rkeeperAdapter,
};

// 'client' is the universal fallback — used for unknown/missing channels too.
const getAdapter = (channel) => ADAPTERS[channel] || ADAPTERS.client;

// Retry policy for failed dispatches (used by the retry worker).
export const MAX_DISPATCH_ATTEMPTS = 8;
// Exponential backoff capped at 1h: 30s, 1m, 2m, 4m, ...
const backoffMs = (attempts) =>
  Math.min(60 * 60 * 1000, 30 * 1000 * 2 ** Math.max(0, attempts - 1));

// Mirror the order to CRM operators over the existing Socket.io layer.
const notifyOperators = (order) => {
  try {
    const io = getIo();
    if (io) io.emit('order:update', order);
  } catch {
    // realtime is best-effort
  }
};

/**
 * Hand one order to its restaurant's kitchen channel.
 * MUST be called AFTER the order transaction commits — a channel failure should
 * mark the order 'failed' for retry, never roll back the created order.
 * @param {string|object} orderOrId
 */
const dispatch = async (orderOrId) => {
  const order = typeof orderOrId === 'string' ? await Order.findByPk(orderOrId) : orderOrId;
  if (!order) return null;

  const restaurant = await Restaurant.findByPk(order.restaurantId);
  if (!restaurant) return null;

  const adapter = getAdapter(restaurant.deliveryChannel);
  const payload = await serializeOrderForKitchen(order.id);

  order.dispatchAttempts = (order.dispatchAttempts || 0) + 1;
  try {
    const result = await adapter.sendOrder(order, restaurant, payload);
    order.dispatchStatus = result?.dispatchStatus || 'sent';
    if (result?.externalId) order.externalId = result.externalId;
    order.dispatchedAt = new Date();
    order.nextDispatchAt = null; // success — nothing to retry
    await order.save();
  } catch (err) {
    order.dispatchStatus = 'failed';
    order.nextDispatchAt = new Date(Date.now() + backoffMs(order.dispatchAttempts));
    await order.save().catch(() => {});
    // eslint-disable-next-line no-console
    console.error(
      `[kitchen] dispatch failed via "${restaurant.deliveryChannel}" for order ${order.code} ` +
        `(attempt ${order.dispatchAttempts}/${MAX_DISPATCH_ATTEMPTS}):`,
      err?.message || err,
    );
  }

  notifyOperators(order);
  return order;
};

/**
 * Re-push every still-unconfirmed order of a restaurant onto its SSE stream.
 * Called when a 'client' tablet (re)connects, so an offline kitchen never loses orders.
 * @param {string} restaurantId
 */
const replayPending = async (restaurantId) => {
  const orders = await Order.findAll({
    where: {
      restaurantId,
      dispatchStatus: { [Op.in]: ['pending', 'sent', 'failed'] },
      status: { [Op.notIn]: ['done', 'completed', 'cancelled'] },
    },
    order: [['createdAt', 'ASC']],
  });
  for (const order of orders) {
    const payload = await serializeOrderForKitchen(order.id);
    pushToRestaurant(restaurantId, { event: 'order:new', id: order.id, data: payload });
    if (order.dispatchStatus !== 'sent') {
      order.dispatchStatus = 'sent';
      order.dispatchedAt = new Date();
      await order.save().catch(() => {});
    }
  }
  return orders.length;
};

/**
 * Return the orders still awaiting kitchen acknowledgement, serialized for the
 * print-agent / KDS. This backs the POLLING transport — a short GET the agent calls
 * every few seconds — which is reliable on shared hosting (LiteSpeed/Passenger) where
 * long-lived SSE connections get cut (UND_ERR_SOCKET). Pure read: the agent removes an
 * order from this set by POSTing /ack after a successful print.
 * @param {string} restaurantId
 * @returns {Promise<object[]>}
 */
const listPending = async (restaurantId) => {
  const orders = await Order.findAll({
    where: {
      restaurantId,
      dispatchStatus: { [Op.in]: ['pending', 'sent', 'failed'] },
      status: { [Op.notIn]: ['done', 'completed', 'cancelled'] },
    },
    order: [['createdAt', 'ASC']],
  });
  return Promise.all(orders.map((o) => serializeOrderForKitchen(o.id)));
};

/**
 * Kitchen confirms receipt/printing of an order (POST back from the 'client' tablet).
 * @param {string} restaurantId
 * @param {string} orderId
 * @param {'accepted'|'failed'} [status]
 */
const acknowledge = async (restaurantId, orderId, status = 'accepted') => {
  const order = await Order.findOne({ where: { id: orderId, restaurantId } });
  if (!order) throw new AppError(404, 'Order not found for this restaurant');
  order.dispatchStatus = status === 'failed' ? 'failed' : 'accepted';
  // Kitchen pressed "Принял" — advance the business status so the CRM/operator
  // sees it, but never downgrade an order that's already further along.
  if (status !== 'failed' && order.status === 'pending') {
    order.status = 'accepted';
  }
  await order.save();
  notifyOperators(order);
  return order;
};

/**
 * Normalize an inbound POS webhook (iiko/r_keeper) and apply the status to the order.
 * @param {'iiko'|'rkeeper'} channel
 * @param {object} payload
 */
const handleWebhook = async (channel, payload) => {
  const adapter = getAdapter(channel);
  if (typeof adapter.mapWebhook !== 'function') {
    throw new AppError(400, `Channel "${channel}" does not support webhooks`);
  }
  const { externalId, status } = adapter.mapWebhook(payload);
  const order = await Order.findOne({ where: { externalId } });
  if (!order) return null;
  if (status) order.status = status;
  await order.save();
  notifyOperators(order);
  return order;
};

export default { dispatch, replayPending, listPending, acknowledge, handleWebhook };
