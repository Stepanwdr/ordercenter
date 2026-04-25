import express from 'express';
import UsersController from '../controllers/usersController.js';
import asyncHandler from '../utils/asyncHandler.js';
import authorizeRole from '../middlewares/authorizeRole.js';
import validate from '../middlewares/validate.js';
import { schemas } from '../utils/validators.js';

const router = express.Router();

router.get('/me', asyncHandler(UsersController.me));
router.get('/', authorizeRole('admin', 'operator'), asyncHandler(UsersController.list));
router.post('/', authorizeRole('admin'), validate(schemas.createUser), asyncHandler(UsersController.create));

export default router;
