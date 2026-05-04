import express from 'express';
import MenuItemsController from '../controllers/menuItemsController.js';
import asyncHandler from '../utils/asyncHandler.js';
import validate from '../middlewares/validate.js';
import { schemas } from '../utils/validators.js';

const router = express.Router({ mergeParams: true });

router.get('/:menuId/items', asyncHandler(MenuItemsController.list));
router.post('/:menuId/items', asyncHandler(MenuItemsController.create));

export default router;
