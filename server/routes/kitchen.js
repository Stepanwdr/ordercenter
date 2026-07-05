import express from 'express';
import { Restaurant, RestaurantAddress } from '../models/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import kitchenDispatcher from '../services/kitchen/kitchenDispatcher.js';
import { addClient } from '../services/kitchen/kitchenStream.js';
import { applyCorsHeaders } from '../utils/cors.js';

const router = express.Router();

// Kitchen devices authenticate with a per-scope deviceToken (channelConfig.deviceToken).
// A scope is a BRANCH (филиал) — preferred, each with its own kitchen — or a RESTAURANT
// (legacy: a restaurant with no branches, e.g. the original single-kitchen setup).
// EventSource can't send custom headers, so the SSE stream also accepts ?token=...
async function resolveScope(req, kind) {
  const token = req.query.token || req.headers['x-device-token'];
  if (kind === 'branch') {
    const branch = await RestaurantAddress.findByPk(req.params.id);
    if (!branch) return { error: 404, message: 'Branch not found' };
    const expected = branch.channelConfig?.deviceToken;
    if (expected && token !== expected) return { error: 401, message: 'Invalid device token' };
    return { scope: { branchId: branch.id, restaurantId: branch.restaurantId }, entity: branch };
  }
  const restaurant = await Restaurant.findByPk(req.params.id);
  if (!restaurant) return { error: 404, message: 'Restaurant not found' };
  const expected = restaurant.channelConfig?.deviceToken;
  if (expected && token !== expected) return { error: 401, message: 'Invalid device token' };
  return { scope: { restaurantId: restaurant.id }, entity: restaurant };
}

// Register the kitchen device endpoints under a prefix for a given scope kind. Mounted
// for both '/restaurants' (legacy) and '/branches' (per-branch kitchens).
function registerScope(prefix, kind) {
  // SSE stream: the tablet subscribes and receives `order:new` / `order:cancel`.
  router.get(
    `${prefix}/:id/stream`,
    asyncHandler(async (req, res) => {
      const auth = await resolveScope(req, kind);
      if (auth.error) {
        res.status(auth.error).json({ success: false, message: auth.message });
        return;
      }

      // Set CORS on the SSE response itself — EventSource is cross-origin (frontend →
      // api.deliverydepartment.am) and a reverse proxy may not carry the cors() middleware's
      // headers through this long-lived streaming response.
      applyCorsHeaders(req, res);
      res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no', // disable nginx buffering for SSE
      });
      res.flushHeaders?.();
      res.write(`event: ready\ndata: ${JSON.stringify(auth.scope)}\n\n`);

      const key = auth.scope.branchId || auth.scope.restaurantId;
      const cleanup = addClient(key, res);
      const heartbeat = setInterval(() => {
        try { res.write(': ping\n\n'); } catch { /* will close */ }
      }, 15000);

      // Re-deliver anything the kitchen hasn't acknowledged yet.
      kitchenDispatcher.replayPending(auth.scope).catch(() => {});

      req.on('close', () => {
        clearInterval(heartbeat);
        cleanup();
      });
    }),
  );

  // Polling transport: the print-agent GETs this every few seconds and prints anything it
  // hasn't acked yet. Reliable on shared hosting (LiteSpeed/Passenger) where SSE gets cut.
  router.get(
    `${prefix}/:id/pending`,
    asyncHandler(async (req, res) => {
      const auth = await resolveScope(req, kind);
      if (auth.error) {
        res.status(auth.error).json({ success: false, message: auth.message });
        return;
      }
      const orders = await kitchenDispatcher.listPending(auth.scope);
      res.json({ success: true, data: orders });
    }),
  );

  // Scope identity for the KDS header: restaurant name + brand logo, and (for a branch)
  // the branch name + address. The kitchen tablet shows this so staff can see which point
  // they're serving. Auth is the same per-scope device token as every other endpoint.
  router.get(
    `${prefix}/:id/info`,
    asyncHandler(async (req, res) => {
      const auth = await resolveScope(req, kind);
      if (auth.error) {
        res.status(auth.error).json({ success: false, message: auth.message });
        return;
      }

      let data;
      if (kind === 'branch') {
        // Brand logo lives on the parent restaurant; the branch carries its own name/address.
        const restaurant = await Restaurant.findByPk(auth.entity.restaurantId, {
          attributes: ['id', 'name', 'logo', 'photo'],
        });
        data = {
          scopeKind: 'branches',
          id: auth.entity.id,
          name: auth.entity.name,
          address: auth.entity.address || null,
          restaurantName: restaurant?.name || null,
          logo: restaurant?.logo || restaurant?.photo || auth.entity.photo || null,
        };
      } else {
        data = {
          scopeKind: 'restaurants',
          id: auth.entity.id,
          name: auth.entity.name,
          address: null,
          restaurantName: auth.entity.name,
          logo: auth.entity.logo || auth.entity.photo || null,
        };
      }
      res.json({ success: true, data });
    }),
  );

  // Agent config: the print-agent fetches its printer list here so the CRM is the single
  // source of truth (change a printer IP in the admin → the agent picks it up). Returns
  // the raw "label=ip:port,..." string the agent already knows how to parse.
  router.get(
    `${prefix}/:id/config`,
    asyncHandler(async (req, res) => {
      const auth = await resolveScope(req, kind);
      if (auth.error) {
        res.status(auth.error).json({ success: false, message: auth.message });
        return;
      }
      res.json({ success: true, data: { printers: auth.entity.channelConfig?.printers || [] } });
    }),
  );

  // Kitchen confirms receipt/printing of an order.
  router.post(
    `${prefix}/:id/ack`,
    asyncHandler(async (req, res) => {
      const auth = await resolveScope(req, kind);
      if (auth.error) {
        res.status(auth.error).json({ success: false, message: auth.message });
        return;
      }
      const { orderId, status } = req.body || {};
      if (!orderId) {
        res.status(400).json({ success: false, message: 'orderId is required' });
        return;
      }
      const order = await kitchenDispatcher.acknowledge(orderId, status, auth.scope);
      res.json({ success: true, data: { id: order.id, dispatchStatus: order.dispatchStatus } });
    }),
  );
}

registerScope('/restaurants', 'restaurant'); // legacy: restaurant-level kitchen
registerScope('/branches', 'branch'); // per-branch kitchens

// POS status webhooks (iiko / r_keeper -> /kitchen/webhooks/iiko).
router.post(
  '/webhooks/:channel',
  asyncHandler(async (req, res) => {
    await kitchenDispatcher.handleWebhook(req.params.channel, req.body);
    res.json({ success: true });
  }),
);

export default router;
