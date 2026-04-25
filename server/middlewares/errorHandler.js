export default function errorHandler(error, req, res, next) {
  const statusCode = error.statusCode || error.status || 500;

  res.status(statusCode).json({
    success: false,
    message: error.message || 'Internal server error',
    details: error.details || error.errors || null,
  });
}
