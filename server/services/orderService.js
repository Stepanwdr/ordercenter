import { Courier, Order, Restaurant, User, OrderItem, MenuItem, Menu, sequelize } from '../models/index.js';
import AppError from '../utils/AppError.js';
import { canTransitionOrderStatus } from '../utils/orderFlow.js';

class OrderService {
  static async listOrders() {
    return Order.findAll({
      include: [
        { model: User, as: 'customer' },
        { model: User, as: 'courier' },
        {
          model: Restaurant,
          as: 'restaurant',
          include: [
            {
              model: Menu,
              as: 'menus',
              include: [{ model: MenuItem, as: 'items' }],
            },
          ],
        },
        {
          model: OrderItem,
          as: 'orderItems',
          include: [
            {
              model: MenuItem,
              as: 'menuItem',
              include: [
                {
                  model: Menu,
                  as: 'menu',
                  include: [{ model: Restaurant, as: 'restaurant' }],
                },
              ],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  static async createOrder(payload, authUser) {
    return sequelize.transaction(async (transaction) => {
      const customerId =  authUser.userId;
      const [customer, restaurant] = await Promise.all([
        User.findByPk(customerId, { transaction }),
        Restaurant.findByPk(payload.restaurantId, { transaction }),
      ]);

      if (!customer) {
        throw new AppError(404, 'Customer not found');
      }

      if (!restaurant) {
        throw new AppError(404, 'Restaurant not found');
      }

      // Validate that all order items belong to the specified restaurant
      if (Array.isArray(payload.orderItems) && payload.orderItems.length) {
        for (const oi of payload.orderItems) {
          const item = await MenuItem.findByPk(oi.menuItemId, {
            include: {
              model: Menu,
              as: 'menu',
            },
            transaction,
          });
          const menuRestaurantId = item?.menu?.restaurantId;
          if (!item || !menuRestaurantId || menuRestaurantId !== payload.restaurantId) {
            throw new AppError(400, 'One or more menu items do not belong to the selected restaurant');
          }
        }
      }

      // If orderItems provided, calculate total price from items; otherwise use payload.price
      let totalPrice = payload.price ?? 0;
      if (Array.isArray(payload.orderItems) && payload.orderItems.length) {
        totalPrice = payload.orderItems.reduce((sum, it) => sum + ((it.price ?? 0) * (it.quantity ?? 1)), 0);
      }

      const order = await Order.create(
        {
          status: 'pending',
          price: totalPrice,
          customerId,
          restaurantId: payload.restaurantId,
        },
        { transaction }
      );

      // Attach order items if provided
      if (Array.isArray(payload.orderItems) && payload.orderItems.length) {
        const itemsToCreate = payload.orderItems
          .filter((i) => !!i.menuItemId)
          .map((i) => ({
            orderId: order.id,
            menuItemId: i.menuItemId,
            quantity: i.quantity ?? 1,
            price: i.price ?? 0,
          }));
        if (itemsToCreate.length) {
          await OrderItem.bulkCreate(itemsToCreate, { transaction });
        }
      }

      return order;
    });
  }

  static async assignCourier(orderId, courierId) {
    return sequelize.transaction(async (transaction) => {
      const [order, courierProfile, courierUser] = await Promise.all([
        Order.findByPk(orderId, { transaction }),
        Courier.findByPk(courierId, { transaction }),
        User.findByPk(courierId, { transaction }),
      ]);

      if (!order) {
        throw new AppError(404, 'Order not found');
      }

      if (!courierProfile || !courierUser || courierUser.role !== 'courier') {
        throw new AppError(404, 'Courier not found');
      }

      order.courierId = courierId;
      if (order.status === 'pending') {
        order.status = 'accepted';
      }

      courierProfile.status = 'busy';

      await Promise.all([
        order.save({ transaction }),
        courierProfile.save({ transaction }),
      ]);

      return order;
    });
  }

  static async updateOrderStatus(orderId, nextStatus) {
    return sequelize.transaction(async (transaction) => {
      const order = await Order.findByPk(orderId, { transaction });

      if (!order) {
        throw new AppError(404, 'Order not found');
      }

      if (!canTransitionOrderStatus(order.status, nextStatus)) {
        throw new AppError(409, `Cannot move order from ${order.status} to ${nextStatus}`);
      }

      order.status = nextStatus;
      await order.save({ transaction });

      if (nextStatus === 'completed' && order.courierId) {
        await Courier.update(
          { status: 'available' },
          {
            where: { userId: order.courierId },
            transaction,
          }
        );
      }

      return order;
    });
  }
}

export default OrderService;
