import AppError from '../../../utils/AppError.js';

// iiko Transport (Cloud API) adapter — SKELETON.
// Flow when implemented:
//   1) POST /api/1/access_token        { apiLogin }                 -> token (cache ~1h)
//   2) GET  /api/1/organizations                                    -> organizationId
//   3) POST /api/1/terminal_groups     { organizationIds }          -> terminalGroupId
//   4) POST /api/1/deliveries/create   { organizationId, terminalGroupId, order } -> external delivery id
// iiko then POSTs status webhooks back to /kitchen/webhooks/iiko.
//
// config (restaurant.channelConfig): { apiLogin, organizationId, terminalGroupId, baseUrl }
export const iikoAdapter = {
  name: 'iiko',

  async sendOrder(/* order, restaurant, payload */) {
    // TODO: implement auth-token cache + terminalGroup resolution + deliveries/create.
    throw new AppError(501, 'iiko adapter not implemented yet');
  },

  async cancelOrder(/* order, restaurant */) {
    throw new AppError(501, 'iiko adapter not implemented yet');
  },

  // Normalize an incoming iiko webhook into { externalId, status }.
  mapWebhook(/* payload */) {
    throw new AppError(501, 'iiko adapter not implemented yet');
  },
};
