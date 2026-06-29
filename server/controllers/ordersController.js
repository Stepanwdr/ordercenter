import OrderService from '../services/orderService.js';

class OrdersController {
  static list = async (req, res) => {
    const result = await OrderService.listOrders(req.query, req.auth);
    res.json({
      success: true,
      ...result,
    });
  };

  static stats = async (req, res) => {
    const stats = await OrderService.getStats();
    res.json({ success: true, data: stats });
  };

  static statusCounts = async (req, res) => {
    const counts = await OrderService.getStatusCounts(req.query, req.auth);
    res.json({ success: true, data: counts });
  };

  static get = async (req, res) => {
    const order = await OrderService.getOrder(req.params.id, req.auth);
    res.json({ success: true, data: order });
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

  static updateType = async (req, res) => {
    const order = await OrderService.updateOrderType(req.params.id, req.validated.orderType);
    res.json({ success: true, data: order });
  };

  static update = async (req, res) => {
    const order = await OrderService.updateOrder(req.params.id, req.validated);
    res.json({ success: true, data: order });
  };

  static remove = async (req, res) => {
    await OrderService.deleteOrder(req.params.id);
    res.json({ success: true, data: { id: req.params.id } });
  };
}

export default OrdersController;
