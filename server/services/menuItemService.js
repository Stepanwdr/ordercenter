import MenuItem from '../models/MenuItem.js';
import Menu from '../models/Menu.js';
import Category from '../models/Category.js';
import AppError from '../utils/AppError.js';
import { Op } from 'sequelize';

const generateNumericArticle = () => {
  const min = 10000000;
  const max = 99999999;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
};

const createUniqueArticle = async () => {
  const maxAttempts = 10;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const article = generateNumericArticle();
    const exists = await MenuItem.findOne({ where: { article } });
    if (!exists) {
      return article;
    }
  }

  throw new AppError(500, 'Failed to generate unique article');
};

class MenuItemService {
  static async list(menuId, search = '') {
    const menu = await Menu.findByPk(menuId);
    if (!menu) throw new AppError(404, 'Menu not found');
    const normalized = search.trim();
    const where = normalized
      ? {
          menuId,
          [Op.or]: [
            { name: { [Op.like]: `%${normalized}%` } },
            { description: { [Op.like]: `%${normalized}%` } },
            { article: { [Op.like]: `%${normalized}%` } },
            { '$category.name$': { [Op.like]: `%${normalized}%` } },
          ],
        }
      : { menuId };

    return MenuItem.findAll({
      where,
      include: [{ model: Category, as: 'category', required: false }],
      order: [['createdAt', 'DESC']],
    });
  }

  static async create(menuId, payload) {
    const [menu, category] = await Promise.all([
      Menu.findByPk(menuId),
      Category.findByPk(payload.categoryId),
    ]);

    if (!menu) throw new AppError(404, 'Menu not found');
    if (!category) throw new AppError(404, 'Category not found');
    // Enforce the hierarchy restaurant → menu → category → product: the chosen category
    // must belong to this menu (legacy categories with no menuId are allowed through).
    if (category.menuId && category.menuId !== menuId) {
      throw new AppError(400, 'Category does not belong to this menu');
    }
    const article = await createUniqueArticle();

    const item = await MenuItem.create({
      menuId,
      name: payload.name,
      article,
      price: payload.price,
      description: payload.description,
      image: payload.image ?? null,
      categoryId: payload.categoryId,
      quantity: payload.quantity ?? 1,
      volumeValue: payload.volumeValue ?? null,
      volumeName: payload.volumeName ?? null,
    });
    return item;
  }

  static async remove(menuId, itemId) {
    const item = await MenuItem.findOne({ where: { id: itemId, menuId } });
    if (!item) throw new AppError(404, 'Menu item not found');
    await item.destroy(); // order_items.menu_item_id is SET NULL, so past orders are kept
    return { id: itemId };
  }
}

export default MenuItemService;
