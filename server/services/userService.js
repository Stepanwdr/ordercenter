import { Courier, Restaurant, RefreshToken, User, sequelize } from '../models/index.js';
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

    // A manager is scoped to a restaurant via Restaurant.ownerId — require & link it.
    if (payload.role === 'manager' && !payload.restaurantId) {
      throw new AppError(400, 'Выберите ресторан для руководителя');
    }

    return sequelize.transaction(async (transaction) => {
      const password = await hashPassword(payload.password);
      const user = await User.create(
        {
          email: payload.email.toLowerCase(),
          password,
          role: payload.role,
          name: payload.name ?? null,
        },
        { transaction },
      );

      if (payload.role === 'manager' && payload.restaurantId) {
        const restaurant = await Restaurant.findByPk(payload.restaurantId, { transaction });
        if (!restaurant) throw new AppError(404, 'Restaurant not found');
        restaurant.ownerId = user.id;
        await restaurant.save({ transaction });
      }

      return user;
    });
  }

  static async setPassword(userId, password) {
    const user = await User.unscoped().findByPk(userId);
    if (!user) throw new AppError(404, 'User not found');
    user.password = await hashPassword(password);
    await user.save();
    return { id: user.id };
  }
}

export default UserService;
