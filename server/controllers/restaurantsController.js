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
    let payload = req.validated;
    // If addresses is sent as string (from multipart), try to parse it
    if (typeof payload?.addresses === 'string') {
      try {
        payload.addresses = JSON.parse(payload.addresses);
      } catch {
        payload.addresses = [];
      }
    }
    // If photo uploaded via multipart, map to absolute URL path for client access
    if (req.file) {
      const host = `${req.protocol}://${req.get('host')}`;
      console.log(req.file)
      payload.photo = `${host}/uploads/${req.file.filename}.png`;
      payload.lat = Number(req.lat);
      payload.lng = Number(req.lng);
    }
    const restaurant = await RestaurantService.createRestaurant(payload, req.auth);
    res.status(201).json({
      success: true,
      data: restaurant,
    });
  };
}

export default RestaurantsController;
