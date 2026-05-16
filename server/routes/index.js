import express from 'express';
import authRoutes from './auth.js';
import userRoutes from './users.js';
import restaurantRoutes from './restaurants.js';
import orderRoutes from './orders.js';
import courierRoutes from './courier.js';
import telegramRoutes from './telegram.js';
import menusRoutes from './menus.js';
import menuItemsRoutes from './menuItems.js';
import categoriesRoutes from './categories.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Order Center API',
  });
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/restaurants', restaurantRoutes);
router.use('/orders', orderRoutes);
// New menu-related routes
router.use('/restaurants/:restaurantId/menus', menusRoutes);
router.use('/menus', menusRoutes);
router.use('/menus', menuItemsRoutes);
router.use('/categories', categoriesRoutes);
router.use('/couriers', courierRoutes);
router.use('/telegram', telegramRoutes);

export default router;
