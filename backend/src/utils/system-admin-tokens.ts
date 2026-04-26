import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";

import type { SystemAdminTokenClaims } from "../types/system-admin";
import { env } from "./env";

type CreateSystemAdminTokenInput = {
  sub: string;
  email: string;
  sessionId: string;
};

export const createSystemAdminAccessToken = (claims: CreateSystemAdminTokenInput): string => {
  const options: SignOptions = {
    subject: claims.sub,
    issuer: "hubly-system-admin",
    expiresIn: env.SYSTEM_ADMIN_ACCESS_EXPIRES_IN as NonNullable<SignOptions["expiresIn"]>,
  };

  return jwt.sign(
    {
      email: claims.email,
      tokenType: "system_admin_access",
      sessionId: claims.sessionId,
    },
    env.SYSTEM_ADMIN_JWT_SECRET,
    options,
  );
};

export const verifySystemAdminAccessToken = (token: string): SystemAdminTokenClaims => {
  const payload = jwt.verify(token, env.SYSTEM_ADMIN_JWT_SECRET, {
    issuer: "hubly-system-admin",
  }) as jwt.JwtPayload;

  if (payload.tokenType !== "system_admin_access") {
    throw new Error("Invalid system admin token type.");
  }

  return {
    sub: String(payload.sub),
    email: String(payload.email),
    tokenType: "system_admin_access",
    sessionId: String(payload.sessionId),
  };
};
