import { AppError } from "../utils/app-error.js";
import { verifyAccessToken } from "../utils/jwt.js";

export function requireAuth(req, _res, next) {
  const authHeader = req.headers.authorization || "";

  if (!authHeader.startsWith("Bearer ")) {
    return next(new AppError("Unauthorized", 401));
  }

  const token = authHeader.slice(7).trim();
  const payload = verifyAccessToken(token);

  if (!payload?.sub) {
    return next(new AppError("Unauthorized", 401));
  }

  req.user = {
    id: payload.sub,
    email: payload.email,
    provider: payload.provider,
  };

  return next();
}
