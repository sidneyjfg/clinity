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

  public async getMarketplaceAudit() {
    const bookingsRepo = this.dataSource.getRepository(BookingEntity);
    
    // Total de receita e comissões por tipo de pagamento
    const stats = await bookingsRepo
      .createQueryBuilder("booking")
      .select("booking.organizationId", "organizationId")
      .addSelect("org.tradeName", "organizationName")
      .addSelect("SUM(CASE WHEN booking.paymentType = 'online' AND booking.paymentStatus = 'approved' THEN booking.discountedAmountCents ELSE 0 END)", "onlineRevenueCents")
      .addSelect("SUM(CASE WHEN booking.paymentType = 'online' AND booking.paymentStatus = 'approved' THEN booking.platformCommissionCents ELSE 0 END)", "onlineCommissionCents")
      .addSelect("SUM(CASE WHEN booking.paymentType = 'presential' AND booking.status = 'attended' THEN booking.discountedAmountCents ELSE 0 END)", "presentialRevenueCents")
      .addSelect("SUM(CASE WHEN booking.paymentType = 'presential' AND booking.status = 'attended' THEN booking.platformCommissionCents ELSE 0 END)", "presentialCommissionCents")
      .addSelect("COUNT(CASE WHEN booking.paymentType = 'online' THEN 1 END)", "onlineCount")
      .addSelect("COUNT(CASE WHEN booking.paymentType = 'presential' THEN 1 END)", "presentialCount")
      .addSelect("COUNT(CASE WHEN booking.status = 'scheduled' AND booking.startsAt < CURRENT_TIMESTAMP THEN 1 END)", "pendingStatusCount")
      .innerJoin("booking.organization", "org")
      .groupBy("booking.organizationId")
      .addGroupBy("org.tradeName")
      .getRawMany();

    return stats.map(row => ({
      organizationId: row.organizationId,
      organizationName: row.organizationName,
      onlineRevenueCents: Number(row.onlineRevenueCents),
      onlineCommissionCents: Number(row.onlineCommissionCents),
      presentialRevenueCents: Number(row.presentialRevenueCents),
      presentialCommissionCents: Number(row.presentialCommissionCents),
      onlineCount: Number(row.onlineCount),
      presentialCount: Number(row.presentialCount),
      pendingStatusCount: Number(row.pendingStatusCount),
      presentialRatio: row.onlineCount + row.presentialCount > 0 
        ? (Number(row.presentialCount) / (Number(row.onlineCount) + Number(row.presentialCount))) 
        : 0,
    }));
  }
}
