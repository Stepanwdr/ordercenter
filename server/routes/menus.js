import express from 'express';
import MenusController from '../controllers/menusController.js';
import asyncHandler from '../utils/asyncHandler.js';
import validate from '../middlewares/validate.js';
import { schemas } from '../utils/validators.js';

const router = express.Router({ mergeParams: true });

// List menus for a restaurant
router.get('/', asyncHandler(MenusController.list));
router.post('/', validate(schemas.createMenu), asyncHandler(MenusController.create));

export default router;
