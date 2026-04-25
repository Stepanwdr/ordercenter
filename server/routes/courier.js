import express from 'express';
import CourierController from '../controllers/courierController.js';
import asyncHandler from '../utils/asyncHandler.js';
import authorizeRole from '../middlewares/authorizeRole.js';
import validate from '../middlewares/validate.js';
import { schemas } from '../utils/validators.js';

const router = express.Router();

router.get('/', authorizeRole('admin', 'operator'), asyncHandler(CourierController.list));
router.patch('/location', authorizeRole('courier'), validate(schemas.updateCourierLocation), asyncHandler(CourierController.updateLocation));

export default router;
