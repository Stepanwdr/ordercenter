import {Restaurant, RestaurantAddress, User} from '../models/index.js';
import AppError from '../utils/AppError.js';

class RestaurantService {
  static async listRestaurants() {
    return Restaurant.findAll({
      include: [{ model: User, as: 'owner' }, { model: RestaurantAddress, as: 'addresses' }],
      order: [['createdAt', 'DESC']],
    });
  }

  static async createRestaurant(payload, authUser) {
    const ownerId = authUser.userId;
    const owner = await User.findByPk(ownerId);

    if (!owner) {
      throw new AppError(404, 'Restaurant owner not found');
    }

    // Avoid writing singular 'address' field to Restaurants table; it's stored in RestaurantAddress
    const { addresses, ...rest } = payload ?? {};
    const restaurant = await Restaurant.create({
      ...rest,
      ownerId,
    });
    // Addresses (array of objects) for restaurant

    if (Array.isArray(addresses) && addresses.length > 0) {
      const toCreate = addresses.map((a) => ({
        restaurantId: restaurant.id,
        address: a.address,
      }));
      await RestaurantAddress.bulkCreate(toCreate);
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

    const { addresses, ...rest } = payload ?? {};
    await restaurant.update({ ...rest });

    if (Array.isArray(addresses)) {
      // replace existing addresses
      await RestaurantAddress.destroy({ where: { restaurantId: restaurant.id } });
      if (addresses.length > 0) {
        const toCreate = addresses.map((a) => ({ restaurantId: restaurant.id, address: a.address }));
        await RestaurantAddress.bulkCreate(toCreate);
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
