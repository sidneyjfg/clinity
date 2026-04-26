import type { FastifyInstance } from "fastify";
import type { DataSource } from "typeorm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { buildApp } from "../../../src/app";
import { createTestDataSource } from "../../../src/database/testing/create-test-data-source";
import { env } from "../../../src/utils/env";
import { hashPassword } from "../../../src/utils/password";
import { signInAsAdmin } from "../helpers/auth";

const originalEnv = {
  SYSTEM_ADMIN_EMAIL: env.SYSTEM_ADMIN_EMAIL,
  SYSTEM_ADMIN_PASSWORD_HASH: env.SYSTEM_ADMIN_PASSWORD_HASH,
  SYSTEM_ADMIN_JWT_SECRET: env.SYSTEM_ADMIN_JWT_SECRET,
};

describe("System admin routes", () => {
  let app: FastifyInstance;
  let dataSource: DataSource;

  beforeAll(async () => {
    env.SYSTEM_ADMIN_EMAIL = "owner@hubly.test";
    env.SYSTEM_ADMIN_PASSWORD_HASH = hashPassword("owner-password-123");
    env.SYSTEM_ADMIN_JWT_SECRET = "system-admin-test-secret";

    dataSource = await createTestDataSource();
    app = buildApp({
      dataSource,
    });
    await app.ready();
  });

  afterAll(async () => {
    env.SYSTEM_ADMIN_EMAIL = originalEnv.SYSTEM_ADMIN_EMAIL;
    env.SYSTEM_ADMIN_PASSWORD_HASH = originalEnv.SYSTEM_ADMIN_PASSWORD_HASH;
    env.SYSTEM_ADMIN_JWT_SECRET = originalEnv.SYSTEM_ADMIN_JWT_SECRET;

    if (app) {
      await app.close();
    }

    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  it("issues a dedicated system admin token and rejects tenant tokens", async () => {
    const tenantHeaders = await signInAsAdmin(app);

    const tenantAccessResponse = await app.inject({
      method: "GET",
      url: "/v1/system-admin/summary",
      headers: tenantHeaders,
    });

    expect(tenantAccessResponse.statusCode).toBe(401);

    const signInResponse = await app.inject({
      method: "POST",
      url: "/v1/system-admin/auth/sign-in",
      payload: {
        email: "owner@hubly.test",
        password: "owner-password-123",
      },
    });

    expect(signInResponse.statusCode).toBe(200);
    expect(signInResponse.json()).toEqual(
      expect.objectContaining({
        actorId: "system-owner",
        email: "owner@hubly.test",
        tokenType: "system_admin_access",
      }),
    );

    const summaryResponse = await app.inject({
      method: "GET",
      url: "/v1/system-admin/summary",
      headers: {
        authorization: `Bearer ${signInResponse.json().accessToken}`,
      },
    });

    expect(summaryResponse.statusCode).toBe(200);
    expect(summaryResponse.json()).toEqual(
      expect.objectContaining({
        tenants: expect.any(Number),
        auditEvents: expect.any(Number),
      }),
    );
  });
});
