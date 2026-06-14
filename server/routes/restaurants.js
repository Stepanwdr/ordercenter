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
// Authed single-restaurant fetch (includes channelConfig). Not in PUBLIC_ROUTES.
router.get('/:id', authorizeRole('admin', 'operator'), asyncHandler(RestaurantsController.get));
router.post('/', authorizeRole('admin', 'operator'), upload.single('photo'), validate(schemas.createRestaurant), asyncHandler(RestaurantsController.create));
router.put('/:id', authorizeRole('admin', 'operator'), upload.single('photo'), validate(schemas.updateRestaurant), asyncHandler(RestaurantsController.update));
router.delete('/:id', authorizeRole('admin', 'operator'), asyncHandler(RestaurantsController.delete));

export default router;
