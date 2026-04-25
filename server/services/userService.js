import { Courier, Restaurant, RefreshToken, User } from '../models/index.js';
import AppError from '../utils/AppError.js';
import { hashPassword } from '../utils/password.js';

class UserService {
  static async listUsers() {
    return User.findAll({
      include: [
        { model: Courier, as: 'courierProfile' },
        { model: Restaurant, as: 'ownedRestaurants' },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  static async getMe(userId) {
    const user = await User.findByPk(userId, {
      include: [
        { model: Courier, as: 'courierProfile' },
        { model: Restaurant, as: 'ownedRestaurants' },
        { model: RefreshToken, as: 'refreshTokens' },
      ],
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return user;
  }

  static async createUser(payload) {
    const exists = await User.unscoped().findOne({
      where: { email: payload.email.toLowerCase() },
    });

    if (exists) {
      throw new AppError(409, 'Email is already registered');
    }

    const password = await hashPassword(payload.password);
    return User.create({
      email: payload.email.toLowerCase(),
      password,
      role: payload.role,
    });
  }
}

export default UserService;
