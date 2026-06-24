import CategoryService from '../services/categoryService.js';

class CategoriesController {
  static list = async (req, res) => {
    const categories = await CategoryService.list(req.query.menuId);
    res.json({ success: true, data: categories });
  };

  static create = async (req, res) => {
    const category = await CategoryService.create(req.validated);
    res.status(201).json({ success: true, data: category });
  };

  static update = async (req, res) => {
    const category = await CategoryService.update(req.params.id, req.validated);
    res.json({ success: true, data: category });
  };

  static remove = async (req, res) => {
    await CategoryService.remove(req.params.id);
    res.json({ success: true, data: { id: req.params.id } });
  };
}

export default CategoriesController;
