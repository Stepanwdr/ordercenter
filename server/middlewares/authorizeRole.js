import AppError from '../utils/AppError.js';

export default function authorizeRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.auth || !allowedRoles.includes(req.auth.role)) {
      // eslint-disable-next-line no-console
      console.log(`[authorizeRole] path=${req.originalUrl} auth=`, req.auth, 'allowed=', allowedRoles);
      next(new AppError(403, 'You do not have permission to perform this action'));
      return;
    }

    next();
  };
}
