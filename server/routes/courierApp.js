import { Router } from 'express';
import { verifyTelegramInitData } from '../utils/telegramAuth.js';
import { Courier, Order, OrderItem, MenuItem, Menu, Restaurant, User } from '../models/index.js';
import AppError from '../utils/AppError.js';
import { canTransitionOrderStatus } from '../utils/orderFlow.js';
import { getIo } from '../services/socket.js';

const router = Router();

function authMiddleware(req, res, next) {
  const authHeader = req.headers['x-telegram-init-data'];
  if (!authHeader) return next(new AppError(401, 'Missing Telegram auth'));

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) return next(new AppError(500, 'TELEGRAM_BOT_TOKEN not configured'));

  const user = verifyTelegramInitData(authHeader, botToken);
  if (!user) return next(new AppError(401, 'Invalid Telegram auth data'));

  req.telegramUser = user;
  next();
}

async function findCourierByTelegramId(telegramId) {
  const tid = String(telegramId);
  return Courier.findOne({
    where: { telegramId: tid },
    include: [{ model: User, as: 'user' }, { model: Restaurant, as: 'restaurant' }],
  });
}

router.get('/me', authMiddleware, async (req, res) => {
  const courier = await findCourierByTelegramId(req.telegramUser.id);
  if (!courier) return res.json({ success: true, data: null, message: 'Not registered as courier' });
  res.json({ success: true, data: courier });
});

router.get('/orders', authMiddleware, async (req, res) => {
  const courier = await findCourierByTelegramId(req.telegramUser.id);
  if (!courier) throw new AppError(404, 'Courier not found');

  const orders = await Order.findAll({
    where: { courierId: courier.userId },
    include: [
      { model: User, as: 'operator' },
      {
        model: Restaurant,
        as: 'restaurant',
        include: [{ model: Menu, as: 'menus', include: [{ model: MenuItem, as: 'items' }] }],
      },
      {
        model: OrderItem,
        as: 'orderItems',
        include: [{ model: MenuItem, as: 'menuItem', include: [{ model: Menu, as: 'menu' }] }],
      },
    ],
    order: [['createdAt', 'DESC']],
  });

  res.json({ success: true, data: orders });
});

router.patch('/orders/:id/status', authMiddleware, async (req, res) => {
  const courier = await findCourierByTelegramId(req.telegramUser.id);
  if (!courier) throw new AppError(404, 'Courier not found');

  const order = await Order.findOne({
    where: { id: req.params.id, courierId: courier.userId },
  });
  if (!order) throw new AppError(404, 'Order not found or not assigned to you');

  const { status } = req.body;
  if (!status) throw new AppError(400, 'status is required');

  if (!canTransitionOrderStatus(order.status, status)) {
    throw new AppError(409, `Cannot move order from ${order.status} to ${status}`);
  }

  order.status = status;
  await order.save();

  if (status === 'completed') {
    await Courier.update({ status: 'available' }, { where: { userId: courier.userId } });
  }

  try {
    const io = getIo();
    if (io) io.emit('order:update', order);
  } catch {}

  res.json({ success: true, data: order });
});

router.patch('/location', authMiddleware, async (req, res) => {
  const { lat, lng } = req.body;
  if (lat == null || lng == null) throw new AppError(400, 'lat and lng required');

  const courier = await findCourierByTelegramId(req.telegramUser.id);
  if (!courier) throw new AppError(404, 'Courier not found');

  courier.lat = lat;
  courier.lng = lng;
  await courier.save();

  res.json({ success: true, data: courier });
});

export default router;
