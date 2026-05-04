import express from 'express';
import RestaurantsController from '../controllers/restaurantsController.js';
import asyncHandler from '../utils/asyncHandler.js';
import authorizeRole from '../middlewares/authorizeRole.js';
import validate from '../middlewares/validate.js';
import { schemas } from '../utils/validators.js';
import multer from 'multer';

const upload = multer({ dest: './uploads' });

const router = express.Router();

router.get('/', asyncHandler(RestaurantsController.list));
router.post('/', authorizeRole('admin', 'operator'), upload.single('photo'), validate(schemas.createRestaurant), asyncHandler(RestaurantsController.create));

export default router;
