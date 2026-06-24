import MenuItemService from '../services/menuItemService.js';

class MenuItemsController {
  static list = async (req, res) => {
    const { menuId } = req.params;
    const search = typeof req.query.search === 'string' ? req.query.search : '';
    const items = await MenuItemService.list(menuId, search);
    res.json({ success: true, data: items });
  };

  static create = async (req, res) => {
    const { menuId } = req.params;
    const item = await MenuItemService.create(menuId, req.validated);
    res.status(201).json({ success: true, data: item });
  };

  static remove = async (req, res) => {
    const { menuId, itemId } = req.params;
    await MenuItemService.remove(menuId, itemId);
    res.json({ success: true, data: { id: itemId } });
  };
}

export default MenuItemsController;
