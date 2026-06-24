import express from 'express';
import CategoriesController from '../controllers/categoriesController.js';
import asyncHandler from '../utils/asyncHandler.js';
import validate from '../middlewares/validate.js';
import { schemas } from '../utils/validators.js';

const router = express.Router();

router.get('/', asyncHandler(CategoriesController.list));
router.post('/', validate(schemas.createCategory), asyncHandler(CategoriesController.create));
router.patch('/:id', validate(schemas.updateCategory), asyncHandler(CategoriesController.update));
router.delete('/:id', asyncHandler(CategoriesController.remove));

export default router;
