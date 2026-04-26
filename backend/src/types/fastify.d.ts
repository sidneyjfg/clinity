import "fastify";

import type { AuthenticatedRequestUser } from "./auth";
import type { SystemAdminRequestUser } from "./system-admin";

declare module "fastify" {
  interface FastifyRequest {
    authUser?: AuthenticatedRequestUser;
    systemAdminUser?: SystemAdminRequestUser;
  }
}
