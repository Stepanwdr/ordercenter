import { Op, fn, col } from 'sequelize';
import { User, Courier, Restaurant, Order } from '../models/index.js';
import AppError from '../utils/AppError.js';
import { getIo } from './socket.js';

// Orders that still occupy a courier (i.e. count toward their current load).
const ACTIVE_ORDER_STATUSES = ['pending', 'accepted', 'cooking', 'ready', 'picked_up', 'delivering', 'enRoute'];

const withLoad = (courier, activeOrdersCount) => {
  const json = typeof courier.toJSON === 'function' ? courier.toJSON() : courier;
  const max = json.maxOrders ?? 0;
  json.activeOrdersCount = activeOrdersCount;
  json.availableSlots = Math.max(0, max - activeOrdersCount);
  return json;
};

class CourierService {
  static async listCouriers() {
    const couriers = await Courier.findAll({
      include: [{ model: User, as: 'user' }, { model: Restaurant, as: 'restaurant' }],
      order: [['createdAt', 'DESC']],
    });
    // Active order count per courier in a single grouped query.
    const rows = await Order.findAll({
      attributes: ['courierId', [fn('COUNT', col('id')), 'cnt']],
      where: { courierId: { [Op.ne]: null }, status: { [Op.in]: ACTIVE_ORDER_STATUSES } },
      group: ['courierId'],
      raw: true,
    });
    const countByCourier = {};
    rows.forEach((r) => { countByCourier[r.courierId] = Number(r.cnt) || 0; });

    // Address to show on the card: the CURRENT (active) order's address if the courier has
    // one in progress, otherwise where they finished their most recent order.
    const courierIds = couriers.map((c) => c.userId).filter(Boolean);
    const currentByCourier = {};
    const lastByCourier = {};
    if (courierIds.length) {
      const [active, completed] = await Promise.all([
        Order.findAll({
          where: { courierId: { [Op.in]: courierIds }, status: { [Op.in]: ACTIVE_ORDER_STATUSES } },
          attributes: ['courierId', 'code', 'deliveryAddress', 'createdAt'],
          order: [['createdAt', 'DESC']],
        }),
        Order.findAll({
          where: { courierId: { [Op.in]: courierIds }, status: { [Op.in]: ['done', 'completed'] } },
          attributes: ['courierId', 'code', 'deliveryAddress', 'completedAt', 'createdAt'],
          order: [['completedAt', 'DESC'], ['createdAt', 'DESC']],
        }),
      ]);
      for (const o of active) {
        if (!currentByCourier[o.courierId]) {
          currentByCourier[o.courierId] = { code: o.code, address: o.deliveryAddress, at: o.createdAt, current: true };
        }
      }
      for (const o of completed) {
        if (!lastByCourier[o.courierId]) {
          lastByCourier[o.courierId] = { code: o.code, address: o.deliveryAddress, at: o.completedAt || o.createdAt, current: false };
        }
      }
    }

    return couriers.map((c) => {
      const json = withLoad(c, countByCourier[c.userId] || 0);
      json.lastDelivery = currentByCourier[c.userId] || lastByCourier[c.userId] || null;
      return json;
    });
  }

  static async getCourier(userId) {
    const courier = await Courier.findByPk(userId, {
      include: [{ model: User, as: 'user' }, { model: Restaurant, as: 'restaurant' }],
    });
    if (!courier) return null;
    const activeOrdersCount = await Order.count({
      where: { courierId: userId, status: { [Op.in]: ACTIVE_ORDER_STATUSES } },
    });
    return withLoad(courier, activeOrdersCount);
  }

  static async createCourier(payload, auth) {
  const {name = '',email = '', phone='', restaurantId }=payload
    const user = await User.create({ password: 'changeme', role: 'courier',name,email,phone });

    const courier = await Courier.create({ userId: user.id,name: payload.name, status: payload?.status ?? 'free', lat: payload?.lat ?? null, lng: payload?.lng ?? null, maxOrders: payload?.maxOrders ?? 3, restaurantId });
    // persist telegramId if provided
    if (payload.telegramId) {
      await courier.update({ telegramId: payload.telegramId });
    }
    return Courier.findByPk(courier.userId, { include: [{ model: User, as: 'user' }] });
  }

  static async updateCourier(userId, payload, auth) {
    const courier = await Courier.findByPk(userId);
    if (!courier) throw new AppError(404, 'Courier not found');
    // Basic authorization: allow the courier owner, an admin, or an operator.
    // Assuming auth contains userId and role.
    const isOwner = auth?.userId === userId;
    const isPrivileged = auth?.role === 'admin' || auth?.role === 'operator';
    if (!isOwner && !isPrivileged) {
      throw new AppError(403, 'Not authorized to update courier');
    }
    // Courier-table fields
    const updates = {}

    if ('status' in payload) updates['status'] = payload.status;
    if ('lat' in payload) updates['lat'] = payload.lat;
    if ('lng' in payload) updates['lng'] = payload.lng;
    if ('maxOrders' in payload) updates['maxOrders'] = payload.maxOrders;
    if ('telegramId' in payload) updates['telegramId'] = payload.telegramId;
    if ('restaurantId' in payload) {
      const restaurantId = (payload).restaurantId;
      if (restaurantId) {
        const exists = await Restaurant.findByPk(restaurantId);
        if (!exists) throw new AppError(404, 'Restaurant not found');
        updates['restaurantId'] = restaurantId;
      } else {
        updates['restaurantId'] = null;
      }
    }
    await courier.update(updates);

    // User-table fields (name/email/phone live on the associated User, not Courier)
    const userUpdates = {};
    if ('name' in payload) userUpdates['name'] = payload.name;
    if ('email' in payload) userUpdates['email'] = payload.email;
    if ('phone' in payload) userUpdates['phone'] = payload.phone;
    if ('avatar' in payload) userUpdates['avatar'] = payload.avatar;
    if (Object.keys(userUpdates).length) {
      const user = await User.findByPk(userId);
      if (user) await user.update(userUpdates);
    }

    // return with user included
    return Courier.findByPk(userId, { include: [{ model: User, as: 'user' }] });
  }

  static async updateCourierStatus(userId, status, orderId) {
    const courier = await Courier.findByPk(userId);
    if (!courier) throw new AppError(404, 'Courier not found');
    courier.status = status;
    await courier.save();
    try {
      const io = getIo();
      if (io) {
        io.emit('courier:update', { ...courier.toJSON(), orderId });
        if (orderId) io.emit('order:courier_status_changed', { orderId, courierId: userId, status });
      }
    } catch {}
    return Courier.findByPk(userId, { include: [{ model: User, as: 'user' }] });
  }

  static async deleteCourier(userId, auth) {
    const courier = await Courier.findByPk(userId);
    if (!courier) throw new AppError(404, 'Courier not found');
    const isAdmin = auth?.role === 'admin';
    if (!isAdmin) throw new AppError(403, 'Not authorized to delete courier');
    // remove related user as well
    const user = await User.findByPk(userId);
    await courier.destroy();
    if (user) {
      await user.destroy();
    }
    return;
  }

  static async generateTelegramLink(userId, auth) {
    // permission: admin or owner/operator
    const isAdmin = auth?.role === 'admin';
    const isOwner = auth?.userId === userId;
    if (!isAdmin && !isOwner) throw new AppError(403, 'Not authorized');

    const courier = await Courier.findByPk(userId, { include: [{ model: User, as: 'user' }] });
    if (!courier) throw new AppError(404, 'Courier not found');

    // generate token
    const crypto = await import('crypto');
    const token = crypto.randomBytes(20).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // persist token fields on courier
    await courier.update({ telegram_link_token: token, telegram_link_expires_at: expiresAt });

    const botUsername = process.env.TELEGRAM_BOT_USERNAME;
    const link = `https://t.me/deliverio_orders_bot?start=${token}`;

    return { link, token, expiresAt };
  }
}

export default CourierService;
