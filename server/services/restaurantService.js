import {Restaurant, RestaurantAddress, User} from '../models/index.js';
import AppError from '../utils/AppError.js';

// Map an incoming branch (филиал) payload to model columns. Only provided keys are
// included so an update never wipes fields the form didn't send. channelConfig is merged
// (not replaced) against the branch's existing config so secrets like a deviceToken and
// the printers list survive partial updates.
const branchFields = (a, restaurantId, existingConfig = null) => {
  const out = { restaurantId };
  for (const k of ['name', 'address', 'phone', 'photo', 'lat', 'lng', 'comment', 'deliveryChannel', 'isActive']) {
    if (a[k] !== undefined) out[k] = a[k];
  }
  // channelConfig: merge provided config + the `printers` array into the existing config
  // (so secrets like deviceToken survive a partial update).
  if (a.channelConfig !== undefined || a.printers !== undefined) {
    const cc = { ...(existingConfig || {}), ...(a.channelConfig || {}) };
    if (a.printers !== undefined) cc.printers = a.printers; // [{ name, ip, port }]
    out.channelConfig = cc;
  }
  return out;
};

// Fold a restaurant's own `printers` array into its channelConfig, preserving the rest
// (deviceToken, iiko creds, etc.). Returns the payload with printers removed.
const foldRestaurantPrinters = (payload, existingConfig) => {
  const { printers, ...rest } = payload ?? {};
  if (printers !== undefined) {
    rest.channelConfig = { ...(existingConfig || {}), ...(rest.channelConfig || {}), printers };
  }
  return rest;
};

class RestaurantService {
  static async listRestaurants() {
    // channelConfig holds per-channel secrets (device tokens, iiko apiLogin, ...).
    // The list is also served publicly (registration page) — never expose it here.
    return Restaurant.findAll({
      attributes: { exclude: ['channelConfig'] },
      include: [
        { model: User, as: 'owner' },
        // Branch channelConfig holds secrets (deviceToken) — never expose in the public list.
        { model: RestaurantAddress, as: 'addresses', attributes: { exclude: ['channelConfig'] } },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  // Full restaurant incl. channelConfig — for the admin edit form (authed route only).
  static async getRestaurant(id) {
    const restaurant = await Restaurant.findByPk(id, {
      include: [{ model: User, as: 'owner' }, { model: RestaurantAddress, as: 'addresses' }],
    });
    if (!restaurant) throw new AppError(404, 'Restaurant not found');
    return restaurant;
  }

  static async createRestaurant(payload, authUser) {
    const ownerId = authUser.userId;
    const owner = await User.findByPk(ownerId);

    if (!owner) {
      throw new AppError(404, 'Restaurant owner not found');
    }

    const { addresses, ...rest0 } = payload ?? {};
    const rest = foldRestaurantPrinters(rest0, null); // restaurant's own printers → channelConfig
    const restaurant = await Restaurant.create({
      ...rest,
      ownerId,
    });
    // Addresses (array of objects) for restaurant

    if (Array.isArray(addresses) && addresses.length > 0) {
      await RestaurantAddress.bulkCreate(addresses.map((a) => branchFields(a, restaurant.id)));
    }
    return restaurant;
  }

  static async updateRestaurant(id, payload, auth) {
    const restaurant = await Restaurant.findByPk(id);
    if (!restaurant) {
      throw new AppError(404, 'Restaurant not found');
    }
    // Authorization: only owner or admins can update
    const isOwner = auth?.userId === restaurant.ownerId;
    const isAdmin = auth?.role === 'admin';
    if (!isOwner && !isAdmin) {
      throw new AppError(403, 'You do not have permission to update this restaurant');
    }

    const { addresses, ...rest0 } = payload ?? {};
    const rest = foldRestaurantPrinters(rest0, restaurant.channelConfig); // merge, keep deviceToken
    await restaurant.update({ ...rest });

    if (Array.isArray(addresses)) {
      // Upsert by id (NOT destroy+recreate) so existing orders keep their branchId FK.
      const existing = await RestaurantAddress.findAll({ where: { restaurantId: restaurant.id } });
      const byId = new Map(existing.map((b) => [b.id, b]));
      const kept = new Set();
      for (const a of addresses) {
        if (a.id && byId.has(a.id)) {
          const existingBranch = byId.get(a.id);
          await existingBranch.update(branchFields(a, restaurant.id, existingBranch.channelConfig));
          kept.add(a.id);
        } else {
          const created = await RestaurantAddress.create(branchFields(a, restaurant.id));
          kept.add(created.id);
        }
      }
      // Branches dropped from the form: soft-disable (keep the row so old orders resolve).
      for (const b of existing) {
        if (!kept.has(b.id) && b.isActive) await b.update({ isActive: false });
      }
    }
    // reload to include addresses
    return Restaurant.findByPk(restaurant.id, {
      include: [{ model: RestaurantAddress, as: 'addresses' }, { model: User, as: 'owner' }],
    });
  }

  static async deleteRestaurant(id, auth) {
    const restaurant = await Restaurant.findByPk(id);
    if (!restaurant) {
      throw new AppError(404, 'Restaurant not found');
    }
    const isOwner = auth?.userId === restaurant.ownerId;
    const isAdmin = auth?.role === 'admin';
    if (!isOwner && !isAdmin) {
      throw new AppError(403, 'You do not have permission to delete this restaurant');
    }
    await restaurant.destroy();
    return;
  }
}

export default RestaurantService;
