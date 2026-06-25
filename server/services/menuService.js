import { Menu, Restaurant, MenuItem, Category, sequelize } from '../models/index.js';
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
    // Just create the menu. Categories are managed per-menu via the category endpoints
    // (no auto-category — that legacy side-effect created menuId-less, slug-broken rows).
    return Menu.create({ restaurantId, name: payload.name });
  }

  static async update(menuId, payload) {
    const menu = await Menu.findByPk(menuId);
    if (!menu) throw new AppError(404, 'Menu not found');
    menu.name = payload.name;
    await menu.save();
    return menu;
  }

  static async remove(menuId) {
    return sequelize.transaction(async (transaction) => {
      const menu = await Menu.findByPk(menuId, { transaction });
      if (!menu) throw new AppError(404, 'Menu not found');
      // A menu owns its items and categories — remove them before the menu (avoids FK errors
      // and orphan rows). Past orders keep their items via order_items.menu_item_id = NULL.
      await MenuItem.destroy({ where: { menuId }, transaction });
      await Category.destroy({ where: { menuId }, transaction });
      await menu.destroy({ transaction });
      return { id: menuId };
    });
  }
}

export default MenuService;
