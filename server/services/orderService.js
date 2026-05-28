import { Op } from 'sequelize';
import { Courier, Order, Restaurant, User, OrderItem, MenuItem, Menu, sequelize } from '../models/index.js';
import telegramService from './telegramService.js';
import AppError from '../utils/AppError.js';
import {canTransitionOrderStatus, statusFieldMap} from '../utils/orderFlow.js';
import { getIo } from './socket.js';
const generateCode=()=>{
  const now = new Date();

  const pad = (n) => n.toString().padStart(2, '0');

  const code = `ORD_${pad(now.getDate())}${pad(now.getMonth() + 1)}${now.getFullYear()}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

  return code;
}

const ORDER_SORTABLE_FIELDS = ['id', 'status', 'price', 'code', 'createdAt', 'updatedAt', 'prepTime', 'payMethod', 'paid', 'customerName', 'customerPhone', 'deliveryAddress', 'orderType', 'courierStatus'];

class OrderService {
  static async listOrders(query = {}) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC', status, search, courierId, restaurantId } = query;

    const safeSortBy = ORDER_SORTABLE_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
    const safeSortOrder = sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const where = {};
    if (status && status !== 'all') {
      if (status === 'new') {
        where.courierId = { [Op.is]: null };
      } else {
        where.status = status;
      }
    }
    if (courierId) where.courierId = courierId;
    if (restaurantId) where.restaurantId = restaurantId;
    if (search) {
      where[Op.or] = [
        { code: { [Op.like]: `%${search}%` } },
        { customerName: { [Op.like]: `%${search}%` } },
        { customerPhone: { [Op.like]: `%${search}%` } },
        { deliveryAddress: { [Op.like]: `%${search}%` } },
        { courierName: { [Op.like]: `%${search}%` } },
      ];
    }
    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        { model: User, as: 'courier' },
        { model: Courier, as: 'courierProfile', include: [{ model: User, as: 'user' }] },
        { model: User, as: 'operator' },
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
      order: [[safeSortBy, safeSortOrder]],
      offset,
      limit: Number(limit),
      distinct: true,
    });

    return {
      data: rows,
      meta: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
    };
  }

  static async getStats() {
    const [active, completed, total] = await Promise.all([
      Order.count({ where: { status: { [Op.notIn]: ['done', 'completed', 'cancelled'] } } }),
      Order.count({ where: { status: ['done', 'completed'] } }),
      Order.count(),
    ]);
    return { active, completed, total };
  }

  static async createOrder(payload, authUser) {
    return sequelize.transaction(async (transaction) => {
      const operatorId =  authUser.userId;
      const [operator, restaurant] = await Promise.all([
        User.findByPk(operatorId, { transaction }),
        Restaurant.findByPk(payload.restaurantId, { transaction }),
      ]);

      if (!operator) {
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
          operatorId,
          restaurantId: payload.restaurantId,
          courierId: payload.courierId ?? null,
          customerPhone: payload.customerPhone ?? null,
          deliveryAddress: payload.deliveryAddress ?? null,
          entrance: payload.entrance ?? null,
          floor: payload.floor ?? null,
          domofon: payload.domofon ?? null,
          home: payload.home ?? null,
          addressComment: payload.addressComment ?? null,
          customerName: payload.customerName ?? null,
          orderType: payload.orderType ?? null,
          code: generateCode(),
          prepTime: payload.prepTime ?? null,
        },
        { transaction }
      );

      // Attach order items if provided
      console.log(payload.orderItems,'payload.orderItems')
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

      // After order created, notify courier via telegram if courier selected and has telegramId
      try {
        if (order.courierId) {
          const courierProfile = await Courier.findByPk(order.courierId);
          if (courierProfile && courierProfile.telegramId) {
            const message = `Նոր պատվեր: \n#${order.code}\nԱնուն: ${order.customerName || '—'}\nՀեռախոս: ${order.customerPhone || '—'}\nՄասնագիտություն: ${order.orderType || '—'}\nՀասցե: ${order.deliveryAddress || '—'}\nԳումար: ${order.price}`;
            await telegramService.sendMessage(courierProfile.telegramId, message);
            // emit socket event for admin clients
            try {
              const io = getIo();
              if (io) io.emit('courier:order_created', { orderId: order.id, courierId: courierProfile.userId, telegramId: courierProfile.telegramId });
            } catch (e) {
              // ignore
            }
          }
        }
      } catch (err) {
        // don't block order creation if telegram fails
        // eslint-disable-next-line no-console
        console.error('Telegram notification failed', err?.message || err);
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
      order.courierName = courierUser.name;
      if (order.status === 'pending') {
        order.status = 'accepted';
      }

      courierProfile.status = 'busy';

      await Promise.all([
        order.save({ transaction }),
        courierProfile.save({ transaction }),
      ]);
      // Notify courier via telegram about assignment
      try {
        if (courierProfile && courierProfile.telegramId) {
          const message = `Ստացել եք նոր պատվեր: \n#${order.code}\nՏվյալներ:\nՊատվիրատու: ${order.customerName || '—'}\nՀեռախոս: ${order.customerPhone || '—'}\nՀասցե: ${order.deliveryAddress || '—'}\nԳումար: ${order.price}`;
          await telegramService.sendMessage(courierProfile.telegramId, message);
        }
      } catch (err) {
        // ignore telegram failure
        // eslint-disable-next-line no-console
        console.error('Telegram notify on assign failed', err?.message || err);
      }

      // emit socket event about assignment
      try {
        const io = getIo();
        if (io) io.emit('order:courier_assigned', { orderId: order.id, courierId: courierProfile.userId });
      } catch (e) {
        // ignore
      }

      return order;
    });
  }

  static async updateOrderStatus(orderId, nextStatus) {
    return sequelize.transaction(async (transaction) => {
      const order = await Order.findByPk(orderId, { transaction });

      if (!order) {
        throw new AppError(404, 'Order not found');
      }

      // if (!canTransitionOrderStatus(order.status, nextStatus)) {
      //   throw new AppError(409, `Cannot move order from ${order.status} to ${nextStatus}`);
      // }

      order.status = nextStatus;
      if(nextStatus ==='done'){
        order.completedAt = new Date();
      }

      await order.save({ transaction });

      if (nextStatus === 'done' && order.courierId) {
        await Courier.update(
          { status: 'free' },
          {
            where: { userId: order.courierId },
            transaction,
          }
        );
      }

      return order;
    });
  }

  static async updateOrderCourierStatus(orderId, courierStatus) {
    const order = await Order.findByPk(orderId);
    if (!order) throw new AppError(404, 'Order not found');

    order.courierStatus = courierStatus;

    const field = statusFieldMap[courierStatus];

    if (field) {
      order[field] = new Date();
    }
    if(courierStatus ==='delivered'){
      order.completedAt = new Date();
      order.status = 'done';
    }
    await order.save();


    try {
      const io = getIo();
      if (io) io.emit('order:update', order);
    } catch {}

    return order;
  }

  static async updateOrderPayMethod(orderId, payMethod) {
    const order = await Order.findByPk(orderId);
    if (!order) throw new AppError(404, 'Order not found');
    order.payMethod = payMethod;
    await order.save();
    try {
      const io = getIo();
      if (io) io.emit('order:update', order);
    } catch {}
    return order;
  }
}

export default OrderService;
