import express from 'express';
import OrdersController from '../controllers/ordersController.js';
import asyncHandler from '../utils/asyncHandler.js';
import authorizeRole from '../middlewares/authorizeRole.js';
import validate from '../middlewares/validate.js';
import { schemas } from '../utils/validators.js';

const router = express.Router();

router.get('/', asyncHandler(OrdersController.list));
router.post('/', authorizeRole('admin', 'customer', 'operator'), validate(schemas.createOrder), asyncHandler(OrdersController.create));
router.patch('/:id/assign-courier', authorizeRole('admin', 'operator'), validate(schemas.assignCourier), asyncHandler(OrdersController.assignCourier));
router.patch('/:id/status', authorizeRole('admin', 'operator', 'courier'), validate(schemas.updateOrderStatus), asyncHandler(OrdersController.updateStatus));

export default router;
