import { Category } from '../models/index.js';
import AppError from '../utils/AppError.js';

const toSlug = (value) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

class CategoryService {
  static async list() {
    return Category.findAll({
      order: [['name', 'ASC']],
    });
  }

  static async create(payload) {
    const slug = payload.slug ? toSlug(payload.slug) : toSlug(payload.name);

    // Use createOrUpdate to avoid duplicate index issues and make operation idempotent
    const category = await Category.createOrUpdate({
      where: { slug },
      defaults: { name: payload.name.trim(), slug },
    });

    // If instance exists but slug matched, we should ensure name is up-to-date
    if (category && category.name !== payload.name.trim()) {
      await category.update({ name: payload.name.trim() });
    }

    return category;
  }
}

export default CategoryService;
