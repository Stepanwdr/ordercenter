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
}

export default MenusController;
