import { Category, MenuItem } from '../models/index.js';
import AppError from '../utils/AppError.js';

// Slug that keeps unicode letters (so Armenian/Russian names don't collapse to empty).
const toSlug = (value) => {
  const s = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/(^-|-$)/g, '');
  return s || `c-${Date.now()}`;
};

class CategoryService {
  static async list(menuId) {
    return Category.findAll({
      where: menuId ? { menuId } : {},
      order: [['name', 'ASC']],
    });
  }

  static async create(payload) {
    const menuId = payload.menuId;
    if (!menuId) throw new AppError(400, 'menuId is required');
    const name = payload.name.trim();
    const slug = payload.slug ? toSlug(payload.slug) : toSlug(name);

    // Idempotent per (menu, slug) — re-adding the same category returns the existing one.
    const [category] = await Category.findOrCreate({
      where: { menuId, slug },
      defaults: { menuId, name, slug },
    });

    if (category.name !== name) {
      await category.update({ name });
    }

    return category;
  }

  static async update(id, payload) {
    const category = await Category.findByPk(id);
    if (!category) throw new AppError(404, 'Category not found');
    const updates = {};
    if (payload.name !== undefined) {
      updates.name = payload.name.trim();
      updates.slug = payload.slug ? toSlug(payload.slug) : toSlug(payload.name);
    } else if (payload.slug !== undefined) {
      updates.slug = toSlug(payload.slug);
    }
    await category.update(updates);
    return category;
  }

  static async remove(id) {
    const category = await Category.findByPk(id);
    if (!category) throw new AppError(404, 'Category not found');
    // Menu items require a category (categoryId NOT NULL), so block deleting a non-empty one.
    const count = await MenuItem.count({ where: { categoryId: id } });
    if (count > 0) throw new AppError(400, 'Категорիան դատարկ չէ — սկզբում տեղափոխեք/ջնջեք ապրանքները');
    await category.destroy();
    return { id };
  }
}

export default CategoryService;
