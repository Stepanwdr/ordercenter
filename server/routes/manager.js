import express from 'express';
import ReportsController from '../controllers/reportsController.js';
import asyncHandler from '../utils/asyncHandler.js';
import authorizeRole from '../middlewares/authorizeRole.js';

const router = express.Router();

// Restaurant-manager cabinet: sales dashboard + reports. Every endpoint is gated to the
// 'manager' (or 'admin') role; data is further scoped to the manager's own restaurants
// inside ReportsService (a foreign restaurantId yields 403), so query params can't widen access.
router.use(authorizeRole('manager', 'admin'));

router.get('/restaurants', asyncHandler(ReportsController.restaurants));
router.get('/sales/overview', asyncHandler(ReportsController.salesOverview));
router.get('/sales/top-items', asyncHandler(ReportsController.topItems));
router.get('/reports/orders.csv', asyncHandler(ReportsController.ordersCsv));

export default router;
