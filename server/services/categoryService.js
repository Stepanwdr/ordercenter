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
    const exists = await Category.findOne({
      where: { slug },
    });

    if (exists) {
      throw new AppError(409, 'Category with this slug already exists');
    }

    return Category.create({
      name: payload.name.trim(),
      slug,
    });
  }
}

export default CategoryService;
