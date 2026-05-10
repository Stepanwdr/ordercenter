import { Menu, Restaurant, MenuItem, Category, sequelize } from '../models/index.js';
import AppError from '../utils/AppError.js';

const toSlug = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

class MenuService {
  static async listForRestaurant(restaurantId) {
    // Ensure restaurant exists
    const rest = await Restaurant.findByPk(restaurantId);
    if (!rest) throw new AppError(404, 'Restaurant not found');
    return Menu.findAll({ where: { restaurantId }, include: [{ model: MenuItem, as: 'items' }], order: [['id', 'ASC']] });
  }

  static async create(restaurantId, payload) {
    return sequelize.transaction(async (transaction) => {
      const rest = await Restaurant.findByPk(restaurantId, { transaction });
      if (!rest) throw new AppError(404, 'Restaurant not found');

      const menu = await Menu.create(
        { restaurantId, name: payload.name },
        { transaction }
      );

      const slug = toSlug(payload.name);
      const existingCategory = await Category.findOne({
        where: { slug },
        transaction,
      });

      if (!existingCategory) {
        await Category.create(
          {
            name: payload.name.trim(),
            slug,
          },
          { transaction }
        );
      }

      return menu;
    });
  }

  static async update(menuId, payload) {
    return sequelize.transaction(async (transaction) => {
      const menu = await Menu.findByPk(menuId, { transaction });
      if (!menu) throw new AppError(404, 'Menu not found');

      menu.name = payload.name;
      await menu.save({ transaction });

      const slug = toSlug(payload.name);
      const existingCategory = await Category.findOne({
        where: { slug },
        transaction,
      });

      if (!existingCategory) {
        await Category.create(
          {
            name: payload.name.trim(),
            slug,
          },
          { transaction }
        );
      }

      return menu;
    });
  }

  static async remove(menuId) {
    return sequelize.transaction(async (transaction) => {
      const menu = await Menu.findByPk(menuId, { transaction });
      if (!menu) throw new AppError(404, 'Menu not found');

      const menuSlug = toSlug(menu.name);

      await menu.destroy({ transaction });

      const otherMenuWithSameSlug = await Menu.findOne({
        where: { name: menu.name },
        transaction,
      });

      if (!otherMenuWithSameSlug) {
        const category = await Category.findOne({
          where: { slug: menuSlug },
          transaction,
        });

        if (category) {
          const relatedItemsCount = await MenuItem.count({
            where: { categoryId: category.id },
            transaction,
          });

          if (relatedItemsCount === 0) {
            await category.destroy({ transaction });
          }
        }
      }

      return { id: menuId };
    });
  }
}

export default MenuService;
