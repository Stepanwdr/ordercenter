import { pushToRestaurant, hasClients } from '../kitchenStream.js';
import { printOrderTicket } from '../printer.js';

// 'client' channel: our own tablet/mini-PC in the restaurant, connected over SSE.
// We don't call out anywhere — we push the order into the restaurant's stream AND
// (best-effort) print a kitchen ticket on the local thermal printer.
// If the tablet is offline, the order is NOT lost: it stays dispatchStatus='sent'
// and the SSE route replays unacknowledged orders on (re)connect. The kitchen
// confirms with POST /kitchen/restaurants/:id/ack -> dispatchStatus='accepted'.
export const clientAdapter = {
  name: 'client',

  /**
   * @returns {{ dispatchStatus: 'sent', externalId: null }}
   */
  async sendOrder(order, restaurant, payload) {
    // Route the live push to the branch's kitchen when the order has one, else the
    // restaurant's (legacy single-kitchen). Polling agents don't rely on this, but a
    // connected SSE client (KDS) does.
    const streamKey = order.branchId || restaurant.id;
    pushToRestaurant(streamKey, { event: 'order:new', id: order.id, data: payload });

    // Print the kitchen ticket directly to the thermal printer (RAW TCP:9100 —
    // over LAN if the backend is local, or over VPN if the backend is in the cloud).
    const printerConfig = restaurant.channelConfig?.printer;
    if (printerConfig?.ip) {
      const result = await printOrderTicket(payload, printerConfig);
      if (!result.ok) {
        const msg = `[kitchen] ticket print failed for ${order.code}: ${result.reason}${result.error ? ` (${result.error})` : ''}`;
        if (printerConfig.required) {
          // Direct print IS the delivery method (cloud → VPN → printer, no tablet):
          // surface the failure so the dispatcher marks it 'failed' and the retry
          // worker re-prints with backoff (transient VPN/printer outages recover).
          throw new Error(msg);
        }
        // Best-effort: an SSE tablet is the backup channel, so don't fail dispatch.
        // eslint-disable-next-line no-console
        console.error(msg);
      }
    }

    // Whether or not a tablet is connected / the printer worked, the order is queued
    // (live push now, or replay on reconnect). 'accepted' comes from the ack.
    return { dispatchStatus: 'sent', externalId: null, online: hasClients(streamKey) };
  },

  async cancelOrder(order, restaurant) {
    pushToRestaurant(order.branchId || restaurant.id, { event: 'order:cancel', id: order.id, data: { id: order.id } });
  },
};
