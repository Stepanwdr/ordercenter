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
        city: a.city,
        street: a.street,
        building: a.building,
        apartment: a.apartment,
        comment: a.comment,
      }));
      await RestaurantAddress.bulkCreate(toCreate);
    }
    return restaurant;
  }
}

export default RestaurantService;
