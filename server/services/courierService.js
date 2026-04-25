import { Courier, User } from '../models/index.js';
import AppError from '../utils/AppError.js';

class CourierService {
  static async listCouriers() {
    return Courier.findAll({
      include: [{ model: User, as: 'user' }],
      order: [['createdAt', 'DESC']],
    });
  }

  static async updateLocation(userId, payload) {
    const courier = await Courier.findByPk(userId);

    if (!courier) {
      throw new AppError(404, 'Courier profile not found');
    }

    courier.lat = payload.lat;
    courier.lng = payload.lng;

    if (payload.status) {
      courier.status = payload.status;
    }

    await courier.save();
    return courier;
  }
}

export default CourierService;
