import MenuItem from '../models/MenuItem.js';
import Menu from '../models/Menu.js';
import AppError from '../utils/AppError.js';

class MenuItemService {
  static async list(menuId) {
    const menu = await Menu.findByPk(menuId);
    if (!menu) throw new AppError(404, 'Menu not found');
    return MenuItem.findAll({ where: { menuId } });
  }

  static async create(menuId, payload) {
    const menu = await Menu.findByPk(menuId);
    if (!menu) throw new AppError(404, 'Menu not found');
    const item = await MenuItem.create({ menuId, name: payload.name, price: payload.price, description: payload.description });
    return item;
  }
}

export default MenuItemService;
