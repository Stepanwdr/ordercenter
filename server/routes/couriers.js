import express from 'express';
import CouriersController from '../controllers/couriersController.js';
import asyncHandler from '../utils/asyncHandler.js';
import authorizeRole from '../middlewares/authorizeRole.js';
import validate from '../middlewares/validate.js';
import { schemas } from '../utils/validators.js';

const router = express.Router();

// List
router.get('/', asyncHandler(CouriersController.list));
// Get by id
router.get('/:id', asyncHandler(CouriersController.get));
// Create
router.post('/', authorizeRole('admin', 'operator'), validate(schemas.createCourier), asyncHandler(CouriersController.create));
// Update
router.put('/:id', authorizeRole('admin', 'operator'), validate(schemas.updateCourier), asyncHandler(CouriersController.update));
// Delete
router.delete('/:id', authorizeRole('admin'), asyncHandler(CouriersController.delete));

export default router;
