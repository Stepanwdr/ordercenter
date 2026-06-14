import AppError from '../../../utils/AppError.js';

// r_keeper adapter — SKELETON. Same contract as the other adapters.
// config (restaurant.channelConfig): { token, objectId, baseUrl }
export const rkeeperAdapter = {
  name: 'rkeeper',

  async sendOrder(/* order, restaurant, payload */) {
    throw new AppError(501, 'r_keeper adapter not implemented yet');
  },

  async cancelOrder(/* order, restaurant */) {
    throw new AppError(501, 'r_keeper adapter not implemented yet');
  },

  mapWebhook(/* payload */) {
    throw new AppError(501, 'r_keeper adapter not implemented yet');
  },
};
