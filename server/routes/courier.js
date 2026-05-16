import express from 'express';
import CouriersController from '../controllers/couriersController.js';
import asyncHandler from '../utils/asyncHandler.js';
import authorizeRole from '../middlewares/authorizeRole.js';
import validate from '../middlewares/validate.js';
import { schemas } from '../utils/validators.js';

const router = express.Router();

router.get('/', asyncHandler(CouriersController.list));
router.get('/:id', asyncHandler(CouriersController.get));
router.post('/', authorizeRole('admin', 'operator'), validate(schemas.createCourier), asyncHandler(CouriersController.create));
router.put('/:id', authorizeRole('admin', 'operator'), validate(schemas.updateCourier), asyncHandler(CouriersController.update));
router.delete('/:id', authorizeRole('admin'), asyncHandler(CouriersController.delete));
router.post('/:id/generate-telegram-link', authorizeRole('admin','operator'), asyncHandler(CouriersController.generateTelegramLink));

export default router;
