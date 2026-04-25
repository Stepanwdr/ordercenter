import { Restaurant, User } from '../models/index.js';
import AppError from '../utils/AppError.js';

class RestaurantService {
  static async listRestaurants() {
    return Restaurant.findAll({
      include: [{ model: User, as: 'owner' }],
      order: [['createdAt', 'DESC']],
    });
  }

  static async createRestaurant(payload, authUser) {
    const ownerId = payload.ownerId || authUser.userId;
    const owner = await User.findByPk(ownerId);

    if (!owner) {
      throw new AppError(404, 'Restaurant owner not found');
    }

    return Restaurant.create({
      name: payload.name,
      ownerId,
      lat: payload.lat,
      lng: payload.lng,
    });
  }
}

export default RestaurantService;
