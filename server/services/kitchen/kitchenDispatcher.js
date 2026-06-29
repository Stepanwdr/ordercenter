import { Op } from 'sequelize';
import { Order, Restaurant, RestaurantAddress } from '../../models/index.js';
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

// Build the WHERE for a kitchen queue. Scope is a branch (preferred) or a restaurant.
// A restaurant-scoped queue returns ONLY branchless orders — so once a restaurant adopts
// branches, its orders flow to the per-branch queues and the restaurant queue empties
// (no double-print, and the legacy single-restaurant agent keeps working meanwhile).
const pendingWhere = (scope) => {
  const where = {
    dispatchStatus: { [Op.in]: ['pending', 'sent', 'failed'] },
    status: { [Op.notIn]: ['done', 'completed', 'cancelled'] },
  };
  if (scope?.branchId) where.branchId = scope.branchId;
  else {
    where.restaurantId = scope?.restaurantId;
    where.branchId = null;
  }
  return where;
};

const scopeKey = (scope) => scope?.branchId || scope?.restaurantId;

/**
 * Re-push every still-unconfirmed order of a scope (branch or restaurant) onto its SSE
 * stream. Called when a 'client' tablet/agent (re)connects, so an offline kitchen never
 * loses orders.
 * @param {{restaurantId?: string, branchId?: string}} scope
 */
const replayPending = async (scope) => {
  const orders = await Order.findAll({ where: pendingWhere(scope), order: [['createdAt', 'ASC']] });
  const key = scopeKey(scope);
  for (const order of orders) {
    const payload = await serializeOrderForKitchen(order.id);
    pushToRestaurant(key, { event: 'order:new', id: order.id, data: payload });
    if (order.dispatchStatus !== 'sent') {
      order.dispatchStatus = 'sent';
      order.dispatchedAt = new Date();
      await order.save().catch(() => {});
    }
  }
  return orders.length;
};

/**
 * Orders still awaiting kitchen acknowledgement, serialized for the print-agent / KDS.
 * Backs the POLLING transport — a short GET the agent calls every few seconds (reliable
 * on shared hosting where long-lived SSE gets cut). Pure read: an order leaves this set
 * when acked.
 * @param {{restaurantId?: string, branchId?: string}} scope
 * @returns {Promise<object[]>}
 */
const listPending = async (scope) => {
  const orders = await Order.findAll({ where: pendingWhere(scope), order: [['createdAt', 'ASC']] });
  return Promise.all(orders.map((o) => serializeOrderForKitchen(o.id)));
};

/**
 * Kitchen confirms receipt/printing of an order. The device token at the route already
 * authorized the caller; here we match by id and (when scoped) verify ownership.
 * @param {string} orderId
 * @param {'accepted'|'failed'} [status]
 * @param {{restaurantId?: string, branchId?: string}} [scope]
 */
const acknowledge = async (orderId, status = 'accepted', scope = {}) => {
  const order = await Order.findByPk(orderId);
  if (!order) throw new AppError(404, 'Order not found');
  if (scope.branchId) {
    if (order.branchId && order.branchId !== scope.branchId) throw new AppError(404, 'Order not found for this branch');
  } else if (scope.restaurantId && order.restaurantId !== scope.restaurantId) {
    throw new AppError(404, 'Order not found for this restaurant');
  }
  if (status === 'failed') {
    order.dispatchStatus = 'failed';
  } else if (status === 'ready') {
    // Kitchen pressed "Готово" — cooking is finished, the dish is ready for pickup/delivery.
    // Advance only from the in-kitchen statuses; never downgrade an order already further along.
    order.dispatchStatus = 'accepted';
    if (['accepted', 'cooking'].includes(order.status)) order.status = 'ready';
  } else {
    // Kitchen pressed "Принял" — it started preparing, so move the order to 'cooking'
    // (shown as "Պատրաստվում է" in the CRM). Only advance from early statuses.
    order.dispatchStatus = 'accepted';
    if (['pending', 'new', 'accepted'].includes(order.status)) order.status = 'cooking';
  }
  await order.save();
  notifyOperators(order);
  // Dedicated realtime event so the CRM can pop a live "order accepted" notification —
  // enriched with the restaurant (name + logo) and branch (name) for the card. Only the
  // initial accept step pops it; the later "Готово" just updates the order via notifyOperators.
  if (status !== 'failed' && status !== 'ready') {
    try {
      const io = getIo();
      if (io) {
        const [restaurant, branch] = await Promise.all([
          Restaurant.findByPk(order.restaurantId, { attributes: ['id', 'name', 'logo', 'photo'] }),
          order.branchId ? RestaurantAddress.findByPk(order.branchId, { attributes: ['id', 'name', 'address'] }) : null,
        ]);
        io.emit('order:accepted', {
          id: order.id,
          code: order.code,
          customerName: order.customerName,
          status: order.status,
          restaurant: restaurant ? { id: restaurant.id, name: restaurant.name, logo: restaurant.logo || restaurant.photo } : null,
          branch: branch ? { id: branch.id, name: branch.name, address: branch.address } : null,
        });
      }
    } catch { /* realtime is best-effort */ }
  }
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
