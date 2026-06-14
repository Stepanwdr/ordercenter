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
    pushToRestaurant(restaurant.id, { event: 'order:new', id: order.id, data: payload });

    // Print the kitchen ticket directly to the thermal printer (RAW TCP:9100).
    // Printing must NOT affect dispatch: failures are logged, never thrown — the
    // SSE push already delivered the order to the tablet (the backup channel).
    const printerConfig = restaurant.channelConfig?.printer;
    if (printerConfig?.ip) {
      const result = await printOrderTicket(payload, printerConfig);
      if (!result.ok) {
        // eslint-disable-next-line no-console
        console.error(`[kitchen] ticket print failed for ${order.code}: ${result.reason}${result.error ? ` (${result.error})` : ''}`);
      }
    }

    // Whether or not a tablet is connected / the printer worked, the order is queued
    // (live push now, or replay on reconnect). 'accepted' comes from the ack.
    return { dispatchStatus: 'sent', externalId: null, online: hasClients(restaurant.id) };
  },

  async cancelOrder(order, restaurant) {
    pushToRestaurant(restaurant.id, { event: 'order:cancel', id: order.id, data: { id: order.id } });
  },
};
