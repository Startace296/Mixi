export function notFoundHandler(req, _res, next) {
  const error = new Error(`Route ${req.method} ${req.originalUrl} not found`);
  error.statusCode = 404;
  next(error);
}

export function errorHandler(error, _req, res, _next) {
  if (error?.errors && Array.isArray(error.errors)) {
    return res.status(error.statusCode || 400).json({
      message: error.message || "Validation failed",
      errors: error.errors,
    });
  }

  if (error?.code === 11000) {
    const duplicateField = Object.keys(error.keyPattern || {})[0];
    const fieldMessage = duplicateField
      ? `${duplicateField} already exists`
      : "Duplicate key error";

    return res.status(409).json({
      message: fieldMessage,
    });
  }

  // Malformed ObjectId (e.g. "/users/abc") is a client error, not a server crash.
  if (error?.name === "CastError") {
    return res.status(400).json({
      message: `Invalid ${error.path || "id"}`,
    });
  }

  const statusCode = error.statusCode || 500;

  if (statusCode >= 500) {
    console.error("Server error:", error);
  }

  res.status(statusCode).json({
    message: statusCode >= 500 ? "Internal server error" : (error.message || "Internal server error"),
  });
}
