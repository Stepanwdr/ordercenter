import express from 'express';
import authRoutes from './auth.js';
import userRoutes from './users.js';
import restaurantRoutes from './restaurants.js';
import orderRoutes from './orders.js';
import courierRoutes from './courier.js';

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
router.use('/courier', courierRoutes);

export default router;
