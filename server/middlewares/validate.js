import { ZodError } from 'zod';
import AppError from '../utils/AppError.js';

export default function validate(schema) {
  return (req, res, next) => {
    try {
      req.validated = schema.parse({
        ...req.body,
        ...req.params,
        ...req.query,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new AppError(422, 'Validation failed', error.flatten()));
        return;
      }
      next(error);
    }
  };
}
