export default function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || error.status || 500;

  // Production-grade: log server errors
  if (process.env.NODE_ENV === 'production' || statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error(error);
  }

  res.status(statusCode).json({
    success: false,
    message: error.message || 'Internal server error',
    details: error.details || error.errors || null,
  });
}
