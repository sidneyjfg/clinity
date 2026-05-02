import type { Role } from "../utils/roles";

export type AccessTokenClaims = {
  sub: string;
  organizationId: string;
  role: Role;
  providerId?: string | null;
  tokenType: "access";
  sessionId: string;
};

export type RefreshTokenClaims = {
  sub: string;
  organizationId: string;
  role: Role;
  providerId?: string | null;
  tokenType: "refresh";
  sessionId: string;
};
