import OrderService from '../services/orderService.js';

class OrdersController {
  static list = async (req, res) => {
    const result = await OrderService.listOrders(req.query);
    res.json({
      success: true,
      ...result,
    });
  };

  static stats = async (req, res) => {
    const stats = await OrderService.getStats();
    res.json({ success: true, data: stats });
  };

  static create = async (req, res) => {
    const order = await OrderService.createOrder(req.validated, req.auth);
    res.status(201).json({
      success: true,
      data: order,
    });
  };

  static assignCourier = async (req, res) => {
    const order = await OrderService.assignCourier(req.params.id, req.validated.courierId);
    res.json({
      success: true,
      data: order,
    });
  };

  static updateStatus = async (req, res) => {
    const order = await OrderService.updateOrderStatus(req.params.id, req.validated.status);
    res.json({
      success: true,
      data: order,
    });
  };

  static updateCourierStatus = async (req, res) => {
    const order = await OrderService.updateOrderCourierStatus(req.params.id, req.validated.courierStatus);
    res.json({ success: true, data: order });
  };

  static updatePayMethod = async (req, res) => {
    const order = await OrderService.updateOrderPayMethod(req.params.id, req.validated.payMethod);
    res.json({ success: true, data: order });
  };
}

export default OrdersController;
