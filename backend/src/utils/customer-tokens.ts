import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";

import { env } from "./env";

export type CustomerAccessTokenClaims = {
  sub: string;
  email?: string | null;
  phone: string;
  tokenType: "customer_access";
};

const signOptions: SignOptions = {
  expiresIn: "30d",
  issuer: "hubly-customer-portal",
};

export const createCustomerAccessToken = (claims: Omit<CustomerAccessTokenClaims, "tokenType">): string => {
  return jwt.sign(
    {
      email: claims.email ?? null,
      phone: claims.phone,
      tokenType: "customer_access",
    },
    env.JWT_ACCESS_SECRET,
    {
      ...signOptions,
      subject: claims.sub,
    },
  );
};

export const verifyCustomerAccessToken = (token: string): CustomerAccessTokenClaims => {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: "hubly-customer-portal",
  }) as jwt.JwtPayload;

  return {
    sub: String(payload.sub),
    email: typeof payload.email === "string" ? payload.email : null,
    phone: String(payload.phone),
    tokenType: "customer_access",
  };
};
