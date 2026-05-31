import express from 'express';
import OrdersController from '../controllers/ordersController.js';
import asyncHandler from '../utils/asyncHandler.js';
import authorizeRole from '../middlewares/authorizeRole.js';
import validate from '../middlewares/validate.js';
import { schemas } from '../utils/validators.js';

const router = express.Router({ mergeParams: true });

router.get('/', asyncHandler(OrdersController.list));
router.get('/stats', asyncHandler(OrdersController.stats));
router.post('/', authorizeRole('admin', 'customer', 'operator'), validate(schemas.createOrder), asyncHandler(OrdersController.create));
router.put('/:id/assign-courier', authorizeRole('admin', 'operator','dispatcher'), validate(schemas.assignCourier), asyncHandler(OrdersController.assignCourier));
router.put('/:id/status',  validate(schemas.updateOrderStatus), asyncHandler(OrdersController.updateStatus));
router.put('/:id/courier-status', validate(schemas.updateOrderCourierStatus), asyncHandler(OrdersController.updateCourierStatus));
router.put('/:id/pay-method',  validate(schemas.updateOrderPayMethod), asyncHandler(OrdersController.updatePayMethod));

export default router;
