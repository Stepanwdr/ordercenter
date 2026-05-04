import { User, Courier, Restaurant } from '../models/index.js';
import AppError from '../utils/AppError.js';
class CourierService {
  static async listCouriers() {
    return Courier.findAll({
      include: [{ model: User, as: 'user' }, { model: Restaurant, as: 'restaurant' }],
      order: [['createdAt', 'DESC']],
    });
  }

  static async getCourier(userId) {
    return Courier.findByPk(userId, {
      include: [{ model: User, as: 'user' }, {model: Restaurant, as: 'restaurant' }],
    });
  }

  static async createCourier(payload, auth) {
  const {name = '',email = '', phone='', restaurantId }=payload
    const user = await User.create({ password: 'changeme', role: 'courier',name,email,phone });
    if (restaurantId) {
      const restaurantExists = await Restaurant.findByPk(restaurantId);
      if (!restaurantExists) throw new AppError(404, 'Restaurant not found');
    }
    const courier = await Courier.create({ userId: user.id,name: payload.name, status: payload?.status ?? 'free', lat: payload?.lat ?? null, lng: payload?.lng ?? null, restaurantId });
    return Courier.findByPk(courier.userId, { include: [{ model: User, as: 'user' }] });
  }

  static async updateCourier(userId, payload, auth) {
    const courier = await Courier.findByPk(userId);
    if (!courier) throw new AppError(404, 'Courier not found');
    // Basic authorization: allow admin or the courier owner (userId)
    // Assuming auth contains userId and role
    const isOwner = auth?.userId === userId;
    const isAdmin = auth?.role === 'admin';
    if (!isOwner && !isAdmin) {
      throw new AppError(403, 'Not authorized to update courier');
    }
    const updates = {}

    if ('status' in payload) updates['status'] = payload.status;
    if ('lat' in payload) updates['lat'] = payload.lat;
    if ('lng' in payload) updates['lng'] = payload.lng;
    if ('restaurantId' in payload) {
      const restaurantId = (payload).restaurantId;
      if (restaurantId) {
        const exists = await Restaurant.findByPk(restaurantId);
        if (!exists) throw new AppError(404, 'Restaurant not found');
        updates['restaurantId'] = restaurantId;
      } else {
        updates['restaurantId'] = null;
      }
    }
    await courier.update(updates);
    // location kept simple; return with user included
    return Courier.findByPk(userId, { include: [{ model: User, as: 'user' }] });
  }

  static async deleteCourier(userId, auth) {
    const courier = await Courier.findByPk(userId);
    if (!courier) throw new AppError(404, 'Courier not found');
    const isAdmin = auth?.role === 'admin';
    if (!isAdmin) throw new AppError(403, 'Not authorized to delete courier');
    // remove related user as well
    const user = await User.findByPk(userId);
    await courier.destroy();
    if (user) {
      await user.destroy();
    }
    return;
  }
}

export default CourierService;
