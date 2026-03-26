import { AppError } from "../utils/app-error.js";

export function validateBody(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join(".") || "body",
        message: issue.message,
      }));

      return next(
        new AppError(
          errors.map((err) => `${err.field}: ${err.message}`).join("; "),
          400,
        )
      );
    }

    // overwrite body bằng data đã được sanitize từ Zod
    req.body = result.data;

    return next();
  };
}