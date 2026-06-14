import cron from 'node-cron';
import { Op } from 'sequelize';
import { Order } from '../../models/index.js';
import kitchenDispatcher, { MAX_DISPATCH_ATTEMPTS } from './kitchenDispatcher.js';

// Re-dispatches orders that FAILED to reach a POS (iiko / r_keeper unreachable, 5xx, etc.).
//
// NOTE: this does NOT cover the 'client' tablet going offline — those orders stay
// 'sent' (not 'failed') and are replayed over SSE on reconnect (kitchenStream +
// dispatcher.replayPending). Pushing to a disconnected tablet would be pointless,
// so the worker intentionally ignores non-'failed' orders.

let task = null;

const runOnce = async () => {
  const now = new Date();
  const orders = await Order.findAll({
    where: {
      dispatchStatus: 'failed',
      dispatchAttempts: { [Op.lt]: MAX_DISPATCH_ATTEMPTS },
      status: { [Op.notIn]: ['done', 'completed', 'cancelled'] },
      [Op.or]: [{ nextDispatchAt: null }, { nextDispatchAt: { [Op.lte]: now } }],
    },
    order: [['dispatchedAt', 'ASC']],
    limit: 50,
  });

  for (const order of orders) {
    await kitchenDispatcher.dispatch(order);
  }
  if (orders.length) {
    // eslint-disable-next-line no-console
    console.info(`[kitchen] retry worker: re-dispatched ${orders.length} failed order(s)`);
  }
};

export function initKitchenRetry() {
  // Disable explicitly (e.g. on extra instances to avoid duplicate retries).
  if (process.env.KITCHEN_RETRY_ENABLED === 'false') return null;
  if (task) return task;
  // Every minute; backoff/attempt-cap inside dispatch keep it from hammering a dead POS.
  task = cron.schedule('* * * * *', () => {
    runOnce().catch((err) => {
      // eslint-disable-next-line no-console
      console.error('[kitchen] retry worker error', err?.message || err);
    });
  });
  // eslint-disable-next-line no-console
  console.info('[kitchen] retry worker started (every 1m)');
  return task;
}

export default { initKitchenRetry, runOnce };
