import express from 'express';
import AuthController from '../controllers/AuthController.js';
import asyncHandler from '../utils/asyncHandler.js';
import validate from '../middlewares/validate.js';
import { schemas } from '../utils/validators.js';

const router = express.Router();

router.post('/register', validate(schemas.register), asyncHandler(AuthController.register));
router.post('/login', validate(schemas.login), asyncHandler(AuthController.login));
router.post('/refresh', validate(schemas.refreshToken), asyncHandler(AuthController.refresh));

export default router;
