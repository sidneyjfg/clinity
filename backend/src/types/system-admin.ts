export type SystemAdminTokenClaims = {
  sub: string;
  email: string;
  tokenType: "system_admin_access";
  sessionId: string;
};

export type SystemAdminRequestUser = {
  id: string;
  email: string;
  sessionId: string;
};

export type SystemAdminSession = {
  accessToken: string;
  sessionId: string;
  actorId: string;
  email: string;
  tokenType: "system_admin_access";
};
