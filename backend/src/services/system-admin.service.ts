import { randomUUID } from "node:crypto";
import type { DataSource } from "typeorm";
import { z } from "zod";

import { AuditEventEntity, BookingEntity, CustomerEntity, OrganizationEntity, UserEntity } from "../database/entities";
import { AuditRepository } from "../repositories/audit.repository";
import { OrganizationsRepository } from "../repositories/organizations.repository";
import type { SystemAdminSession } from "../types/system-admin";
import { AppError } from "../utils/app-error";
import { env } from "../utils/env";
import { verifyPassword } from "../utils/password";
import { parsePagination, type PaginationInput } from "../utils/pagination";
import { createSystemAdminAccessToken } from "../utils/system-admin-tokens";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(120),
});

export class SystemAdminService {
  public constructor(
    private readonly dataSource: DataSource,
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly auditRepository: AuditRepository,
  ) {}

  public async signIn(input: { email: string; password: string }): Promise<SystemAdminSession> {
    const data = signInSchema.parse(input);

    if (!env.SYSTEM_ADMIN_PASSWORD_HASH) {
      throw new AppError("system_admin.not_configured", "System admin access is not configured.", 503);
    }

    const configuredEmail = env.SYSTEM_ADMIN_EMAIL.toLowerCase();
    const email = data.email.toLowerCase();
    if (email !== configuredEmail || !verifyPassword(data.password, env.SYSTEM_ADMIN_PASSWORD_HASH)) {
      throw new AppError("system_admin.invalid_credentials", "Invalid system admin credentials.", 401);
    }

    const sessionId = randomUUID();
    const actorId = "system-owner";

    return {
      accessToken: createSystemAdminAccessToken({
        sub: actorId,
        email,
        sessionId,
      }),
      sessionId,
      actorId,
      email,
      tokenType: "system_admin_access",
    };
  }

  public async listTenants(paginationInput: PaginationInput = {}) {
    return this.organizationsRepository.findAll(parsePagination(paginationInput));
  }

  public async listAuditEvents(input: PaginationInput & { organizationId?: string; action?: string } = {}) {
    return this.auditRepository.findAllForSystemAdmin(parsePagination(input), {
      ...(input.organizationId ? { organizationId: input.organizationId } : {}),
      ...(input.action ? { action: input.action } : {}),
    });
  }

  public async getOperationalSummary(): Promise<{
    tenants: number;
    users: number;
    customers: number;
    bookings: number;
    auditEvents: number;
  }> {
    const [tenants, users, customers, bookings, auditEvents] = await Promise.all([
      this.dataSource.getRepository(OrganizationEntity).count(),
      this.dataSource.getRepository(UserEntity).count(),
      this.dataSource.getRepository(CustomerEntity).count(),
      this.dataSource.getRepository(BookingEntity).count(),
      this.dataSource.getRepository(AuditEventEntity).count(),
    ]);

    return {
      tenants,
      users,
      customers,
      bookings,
      auditEvents,
    };
  }
}
