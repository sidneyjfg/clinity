import type { FastifyReply, FastifyRequest } from "fastify";

import { AppError } from "../utils/app-error";
import { verifySystemAdminAccessToken } from "../utils/system-admin-tokens";

export const systemAdminAuthMiddleware = async (
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> => {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    throw new AppError("system_admin.unauthorized", "Missing system admin bearer token.", 401);
  }

  try {
    const claims = verifySystemAdminAccessToken(authorization.slice("Bearer ".length));
    request.systemAdminUser = {
      id: claims.sub,
      email: claims.email,
      sessionId: claims.sessionId,
    };
  } catch {
    throw new AppError("system_admin.unauthorized", "Invalid system admin token.", 401);
  }
};
