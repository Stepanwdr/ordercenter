import CategoryService from '../services/categoryService.js';

class CategoriesController {
  static list = async (req, res) => {
    const categories = await CategoryService.list();
    res.json({ success: true, data: categories });
  };

  static create = async (req, res) => {
    const category = await CategoryService.create(req.validated);
    res.status(201).json({ success: true, data: category });
  };
}

export default CategoriesController;
