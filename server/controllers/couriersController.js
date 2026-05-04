import CourierService from '../services/courierService.js';
class CouriersController {
  static list = async (req, res) => {
    const couriers = await CourierService.listCouriers();
    res.json({ success: true, data: couriers });
  };

  static get = async (req, res) => {
    const courier = await CourierService.getCourier(req.params.id);
    if (!courier) return res.status(404).json({ success: false, message: 'Courier not found' });
    res.json({ success: true, data: courier });
  };

  static create = async (req, res) => {
    const courier = await CourierService.createCourier(req.validated, req.auth);
    res.status(201).json({ success: true, data: courier });
  };

  static update = async (req, res) => {
    const courier = await CourierService.updateCourier(req.params.id, req.validated, req.auth);
    res.json({ success: true, data: courier });
  };

  static delete = async (req, res) => {
    await CourierService.deleteCourier(req.params.id, req.auth);
    res.status(204).send();
  };
}

export default CouriersController;
