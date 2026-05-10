import MenuService from '../services/menuService.js';

class MenusController {
  static list = async (req, res) => {
    const restaurantId = req.params.restaurantId;
    const menus = await MenuService.listForRestaurant(restaurantId);
    res.json({ success: true, data: menus });
  };

  static create = async (req, res) => {
    const restaurantId = req.params.restaurantId;
    const menu = await MenuService.create(restaurantId, req.validated);
    res.status(201).json({ success: true, data: menu });
  };

  static update = async (req, res) => {
    const menu = await MenuService.update(req.params.menuId, req.validated);
    res.json({ success: true, data: menu });
  };

  static remove = async (req, res) => {
    const result = await MenuService.remove(req.params.menuId);
    res.json({ success: true, data: result });
  };
}

export default MenusController;
