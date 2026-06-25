import { Op } from 'sequelize';
import { Courier, Order, Restaurant, RestaurantAddress, User, OrderItem, MenuItem, Menu, sequelize } from '../models/index.js';
import telegramService from './telegramService.js';
import AppError from '../utils/AppError.js';
import { statusFieldMap } from '../utils/orderFlow.js';
import { getIo } from './socket.js';
import kitchenDispatcher from './kitchen/kitchenDispatcher.js';
const generateCode=()=> {
  const now = new Date();

  const pad = (n) => n.toString().padStart(2, '0');

  const code = `ORD_${pad(now.getDate())}${pad(now.getMonth() + 1)}${now.getFullYear()}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

  return code;
}

const ORDER_SORTABLE_FIELDS = ['id', 'status', 'price', 'code', 'createdAt', 'updatedAt', 'prepTime', 'payMethod', 'paid', 'customerName', 'customerPhone', 'deliveryAddress', 'orderType', 'courierStatus'];

// Full association graph used when returning an order (list or single).
const ORDER_INCLUDE = [
  { model: User, as: 'courier' },
  { model: Courier, as: 'courierProfile', include: [{ model: User, as: 'user' }] },
  { model: User, as: 'operator' },
  {
    model: Restaurant,
    as: 'restaurant',
    include: [{ model: Menu, as: 'menus', include: [{ model: MenuItem, as: 'items' }] }],
  },
  { model: RestaurantAddress, as: 'branch' },
  {
    model: OrderItem,
    as: 'orderItems',
    include: [
      {
        model: MenuItem,
        as: 'menuItem',
        include: [{ model: Menu, as: 'menu', include: [{ model: Restaurant, as: 'restaurant' }] }],
      },
    ],
  },
];

// Deep link into the courier dashboard that opens the order's card preview sheet.
const buildOrderLink = (orderId) => {
  const base = (process.env.TELEGRAM_MINIAPP_URL || 'http://localhost:5173').replace(/\/$/, '');
  return `${base}/?orderId=${orderId}`;
};

// Telegram message extras: an inline button + the raw link appended to the text,
// so the courier can open the order in their dashboard from the notification.
const orderLinkExtras = (orderId) => {
  const link = buildOrderLink(orderId);
  return {
    text: `\n\n🔗 <a href="${link}">Բացել պատվերը</a>`,
    options: {
      reply_markup: {
        inline_keyboard: [[{ text: '📦 Բացել պատվերը', web_app: { url: link } }]],
      },
    },
  };
};

class OrderService {
  static async listOrders(query = {}) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC', status, search, courierId, restaurantId, dateFrom, dateTo } = query;

    const safeSortBy = ORDER_SORTABLE_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
    const safeSortOrder = sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    const where = {};
    // Calendar range filter on createdAt. The client (DateRangePicker) sends exact
    // ISO instants for the start/end of the chosen range — parse them directly.
    if (dateFrom || dateTo) {
      where.createdAt = {};
      const from = dateFrom ? new Date(dateFrom) : null;
      const to = dateTo ? new Date(dateTo) : null;
      if (from && !Number.isNaN(from.getTime())) where.createdAt[Op.gte] = from;
      if (to && !Number.isNaN(to.getTime())) where.createdAt[Op.lte] = to;
    }
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
      include: ORDER_INCLUDE,
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

  static async getOrder(id) {
    const order = await Order.findByPk(id, { include: ORDER_INCLUDE });
    if (!order) throw new AppError(404, 'Order not found');
    return order;
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
    const created = await sequelize.transaction(async (transaction) => {
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

      // Resolve the branch (филиал) the order is fulfilled by; must belong to the restaurant.
      if (payload.branchId) {
        const branch = await RestaurantAddress.findByPk(payload.branchId, { transaction });
        if (!branch || branch.restaurantId !== payload.restaurantId) {
          throw new AppError(400, 'Selected branch does not belong to this restaurant');
        }
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

      // If orderItems provided, calculate items total from them; otherwise use payload.price
      let itemsTotal = payload.price ?? 0;
      if (Array.isArray(payload.orderItems) && payload.orderItems.length) {
        itemsTotal = payload.orderItems.reduce((sum, it) => sum + ((it.price ?? 0) * (it.quantity ?? 1)), 0);
      }
      const deliveryFee = Number(payload.deliveryFee ?? 0) || 0;
      const totalPrice = itemsTotal + deliveryFee;

      const order = await Order.create(
        {
          status: 'pending',
          price: totalPrice,
          deliveryFee,
          operatorId,
          restaurantId: payload.restaurantId,
          branchId: payload.branchId ?? null,
          distance: payload.distance ?? null,
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
            const extras = orderLinkExtras(order.id);
            const message = `Նոր պատվեր: \n#${order.code}\nԱնուն: ${order.customerName || '—'}\nՀեռախոս: ${order.customerPhone || '—'}\nՄասնագիտություն: ${order.orderType || '—'}\nՀասցե: ${order.deliveryAddress || '—'}\nԳումար: ${order.price}${extras.text}`;
            await telegramService.sendMessage(courierProfile.telegramId, message, extras.options);
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

    // After the transaction commits, hand the order to its restaurant's kitchen
    // channel (Adapter/Strategy). A channel failure must NOT roll back the created
    // order — the dispatcher marks it dispatchStatus='failed' for retry/attention.
    try {
      await kitchenDispatcher.dispatch(created);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[kitchen] dispatch error', err?.message || err);
    }

    return created;
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
          const extras = orderLinkExtras(order.id);
          const message = `Ստացել եք նոր պատվեր: \n#${order.code}\nՏվյալներ:\nՊատվիրատու: ${order.customerName || '—'}\nՀեռախոս: ${order.customerPhone || '—'}\nՀասցե: ${order.deliveryAddress || '—'}\nԳումար: ${order.price}${extras.text}`;
          await telegramService.sendMessage(courierProfile.telegramId, message, extras.options);
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
    // Selecting a payment method marks the order as paid.
    order.paid = true;
    await order.save();
    try {
      const io = getIo();
      if (io) io.emit('order:update', order);
    } catch {}
    return order;
  }

  static async updateOrderType(orderId, orderType) {
    const order = await Order.findByPk(orderId);
    if (!order) throw new AppError(404, 'Order not found');
    order.orderType = orderType;
    await order.save();
    try {
      const io = getIo();
      if (io) io.emit('order:update', order);
    } catch {}
    return order;
  }

  // General edit of an order's editable fields (the RUD drawer). Only the keys present in
  // the payload are changed.
  static async updateOrder(orderId, payload) {
    const order = await Order.findByPk(orderId);
    if (!order) throw new AppError(404, 'Order not found');
    const editable = [
      'customerName', 'customerPhone', 'deliveryAddress', 'entrance', 'floor', 'domofon',
      'apartment', 'addressComment', 'prepTime', 'orderType', 'payMethod', 'status',
      'city', 'street', 'building',
    ];
    for (const key of editable) {
      if (payload[key] !== undefined) order[key] = payload[key];
    }
    if (payload.deliveryFee !== undefined) order.deliveryFee = Number(payload.deliveryFee) || 0;
    if (payload.distance !== undefined) order.distance = payload.distance === '' || payload.distance == null ? null : Number(payload.distance);
    await order.save();
    try {
      const io = getIo();
      if (io) io.emit('order:update', order);
    } catch {}
    return OrderService.getOrder(orderId);
  }

  static async deleteOrder(orderId) {
    return sequelize.transaction(async (transaction) => {
      const order = await Order.findByPk(orderId, { transaction });
      if (!order) throw new AppError(404, 'Order not found');
      await OrderItem.destroy({ where: { orderId }, transaction });
      await order.destroy({ transaction });
      try {
        const io = getIo();
        if (io) io.emit('order:delete', { id: orderId });
      } catch {}
      return { id: orderId };
    });
  }
}

export default OrderService;
