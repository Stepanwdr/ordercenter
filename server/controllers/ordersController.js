import OrderService from '../services/orderService.js';

class OrdersController {
  static list = async (req, res) => {
    const orders = await OrderService.listOrders();
    res.json({
      success: true,
      data: orders,
    });
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
}

export default OrdersController;
