import AppError from '../utils/AppError.js';

export default function notFound(req, res, next) {
  next(new AppError(404, `Route ${req.method} ${req.originalUrl} not found`));
}
