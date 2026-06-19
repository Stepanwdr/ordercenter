import express from 'express';
import { Restaurant } from '../models/index.js';
import asyncHandler from '../utils/asyncHandler.js';
import kitchenDispatcher from '../services/kitchen/kitchenDispatcher.js';
import { addClient } from '../services/kitchen/kitchenStream.js';

const router = express.Router();

// Kitchen devices authenticate with a per-restaurant deviceToken (channelConfig.deviceToken).
// EventSource can't send custom headers, so the SSE stream accepts ?token=...
async function resolveDevice(req) {
  const restaurant = await Restaurant.findByPk(req.params.id);
  if (!restaurant) return { error: 404, message: 'Restaurant not found' };
  const token = req.query.token || req.headers['x-device-token'];
  const expected = restaurant.channelConfig?.deviceToken;
  if (expected && token !== expected) return { error: 401, message: 'Invalid device token' };
  return { restaurant };
}

// SSE stream: the tablet subscribes and receives `order:new` / `order:cancel`.
router.get(
  '/restaurants/:id/stream',
  asyncHandler(async (req, res) => {
    const auth = await resolveDevice(req);
    if (auth.error) {
      res.status(auth.error).json({ success: false, message: auth.message });
      return;
    }

    res.set({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // disable nginx buffering for SSE
    });
    res.flushHeaders?.();
    res.write(`event: ready\ndata: ${JSON.stringify({ restaurantId: req.params.id })}\n\n`);

    const cleanup = addClient(req.params.id, res);
    const heartbeat = setInterval(() => {
      try { res.write(': ping\n\n'); } catch { /* will close */ }
    }, 15000);

    // Re-deliver anything the kitchen hasn't acknowledged yet.
    kitchenDispatcher.replayPending(req.params.id).catch(() => {});

    req.on('close', () => {
      clearInterval(heartbeat);
      cleanup();
    });
  }),
);

// Polling transport: the print-agent GETs this every few seconds and prints anything
// it hasn't acked yet. Reliable on shared hosting (LiteSpeed/Passenger) where the SSE
// stream above gets cut. Same device-token auth as the stream.
router.get(
  '/restaurants/:id/pending',
  asyncHandler(async (req, res) => {
    const auth = await resolveDevice(req);
    if (auth.error) {
      res.status(auth.error).json({ success: false, message: auth.message });
      return;
    }
    const orders = await kitchenDispatcher.listPending(req.params.id);
    res.json({ success: true, data: orders });
  }),
);

// Kitchen confirms receipt/printing of an order.
router.post(
  '/restaurants/:id/ack',
  asyncHandler(async (req, res) => {
    const auth = await resolveDevice(req);
    if (auth.error) {
      res.status(auth.error).json({ success: false, message: auth.message });
      return;
    }
    const { orderId, status } = req.body || {};
    if (!orderId) {
      res.status(400).json({ success: false, message: 'orderId is required' });
      return;
    }
    const order = await kitchenDispatcher.acknowledge(req.params.id, orderId, status);
    res.json({ success: true, data: { id: order.id, dispatchStatus: order.dispatchStatus } });
  }),
);

// POS status webhooks (iiko / r_keeper -> /kitchen/webhooks/iiko).
router.post(
  '/webhooks/:channel',
  asyncHandler(async (req, res) => {
    await kitchenDispatcher.handleWebhook(req.params.channel, req.body);
    res.json({ success: true });
  }),
);

export default router;
