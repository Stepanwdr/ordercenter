import CourierService from '../services/courierService.js';

class CourierController {
  static list = async (req, res) => {
    const couriers = await CourierService.listCouriers();
    res.json({
      success: true,
      data: couriers,
    });
  };

  static updateLocation = async (req, res) => {
    const courier = await CourierService.updateLocation(req.auth.userId, req.validated);
    res.json({
      success: true,
      data: courier,
    });
  };
}

export default CourierController;
