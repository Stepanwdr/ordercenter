import { Menu, Restaurant, MenuItem } from '../models/index.js';
import AppError from '../utils/AppError.js';

class MenuService {
  static async listForRestaurant(restaurantId) {
    // Ensure restaurant exists
    const rest = await Restaurant.findByPk(restaurantId);
    if (!rest) throw new AppError(404, 'Restaurant not found');
    return Menu.findAll({ where: { restaurantId }, include: [{ model: MenuItem, as: 'items' }], order: [['id', 'ASC']] });
  }

  static async create(restaurantId, payload) {
    const rest = await Restaurant.findByPk(restaurantId);
    if (!rest) throw new AppError(404, 'Restaurant not found');
    const menu = await Menu.create({ restaurantId, name: payload.name });
    return menu;
  }
}

export default MenuService;
