export function notFoundHandler(req, _res, next) {
  const error = new Error(`Route ${req.method} ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error);
}

export function errorHandler(error, _req, res, _next) {
  if (error?.code === 11000) {
    const duplicateField = Object.keys(error.keyPattern || {})[0];
    const fieldMessage = duplicateField
      ? `${duplicateField} already exists`
      : "Duplicate key error";

    return res.status(409).json({
      message: fieldMessage,
    });
  }

  const statusCode = error.statusCode || 500;

  res.status(statusCode).json({
    message: error.message || "Internal server error",
  });
}
