import AppError from '../utils/AppError.js';
import { verifyAccessToken } from '../utils/tokens.js';
import { User } from '../models/index.js';

export default async function authenticate(req, res, next) {
  try {
    const authorizationHeader = req.headers.authorization || '';
    const token = authorizationHeader.replace(/^Bearer\s+/i, '');

    if (!token) {
      throw new AppError(401, 'Access token is required');
    }

    const payload = verifyAccessToken(token);
    const user = await User.findByPk(payload.userId);

    if (!user) {
      throw new AppError(401, 'User not found for provided token');
    }

    req.auth = {
      userId: user.id,
      role: user.role,
    };
    req.user = user;
    next();
  } catch (error) {
    next(new AppError(401, 'Invalid or expired access token'));
  }
}
