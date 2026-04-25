import RestaurantService from '../services/restaurantService.js';

class RestaurantsController {
  static list = async (req, res) => {
    const restaurants = await RestaurantService.listRestaurants();
    res.json({
      success: true,
      data: restaurants,
    });
  };

  static create = async (req, res) => {
    const restaurant = await RestaurantService.createRestaurant(req.validated, req.auth);
    res.status(201).json({
      success: true,
      data: restaurant,
    });
  };
}

export default RestaurantsController;
