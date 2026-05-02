import type { FastifyReply, FastifyRequest } from "fastify";

import { PaymentsService } from "../services/payments.service";
import { getAuthUser } from "../utils/request-auth";

export class PaymentsController {
  public constructor(private readonly paymentsService: PaymentsService) {}

  public getOrganizationSettings = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    reply.status(200).send(await this.paymentsService.getOrganizationSettings(getAuthUser(request)));
  };

  public updateOrganizationSettings = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    reply.status(200).send(await this.paymentsService.updateOrganizationSettings(getAuthUser(request), request.body));
  };

  public createOrganizationStripeExpressAccount = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    reply.status(200).send(await this.paymentsService.createOrganizationStripeExpressAccount(getAuthUser(request)));
  };

  public createOrganizationStripeOnboardingLink = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    reply.status(200).send(await this.paymentsService.createOrganizationStripeOnboardingLink(getAuthUser(request), request.body));
  };

  public getOrganizationStripeBalance = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    reply.status(200).send(await this.paymentsService.getOrganizationStripeBalance(getAuthUser(request)));
  };

  public requestOrganizationStripePayout = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    reply.status(200).send(await this.paymentsService.requestOrganizationStripePayout(getAuthUser(request), request.body));
  };

  public getOrganizationStripeAccountStatus = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    reply.status(200).send(await this.paymentsService.getOrganizationStripeAccountStatus(getAuthUser(request)));
  };

  public getOrganizationTransactionHistory = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    reply.status(200).send(await this.paymentsService.getOrganizationTransactionHistory(getAuthUser(request)));
  };

  public getOrganizationPayoutHistory = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    reply.status(200).send(await this.paymentsService.getOrganizationPayoutHistory(getAuthUser(request)));
  };

  public getProviderSettings = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const params = request.params as { providerId?: string };
    reply.status(200).send(await this.paymentsService.getProviderSettings(getAuthUser(request), params.providerId ?? ""));
  };

  public updateProviderSettings = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const params = request.params as { providerId?: string };
    reply.status(200).send(
      await this.paymentsService.updateProviderSettings(getAuthUser(request), params.providerId ?? "", request.body),
    );
  };

  public createStripeExpressAccount = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const params = request.params as { providerId?: string };
    reply.status(200).send(
      await this.paymentsService.createStripeExpressAccount(getAuthUser(request), params.providerId ?? ""),
    );
  };

  public createStripeOnboardingLink = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const params = request.params as { providerId?: string };
    reply.status(200).send(
      await this.paymentsService.createStripeOnboardingLink(
        getAuthUser(request),
        params.providerId ?? "",
        request.body,
      ),
    );
  };

  public getStripeBalance = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const params = request.params as { providerId?: string };
    reply.status(200).send(await this.paymentsService.getStripeBalance(getAuthUser(request), params.providerId ?? ""));
  };

  public requestStripePayout = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const params = request.params as { providerId?: string };
    reply.status(200).send(
      await this.paymentsService.requestStripePayout(getAuthUser(request), params.providerId ?? "", request.body),
    );
  };

  public getStripeAccountStatus = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const params = request.params as { providerId?: string };
    reply.status(200).send(await this.paymentsService.getStripeAccountStatus(getAuthUser(request), params.providerId ?? ""));
  };

  public getTransactionHistory = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const params = request.params as { providerId?: string };
    reply.status(200).send(await this.paymentsService.getTransactionHistory(getAuthUser(request), params.providerId ?? ""));
  };

  public getPayoutHistory = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const params = request.params as { providerId?: string };
    reply.status(200).send(await this.paymentsService.getPayoutHistory(getAuthUser(request), params.providerId ?? ""));
  };

  public handleStripeWebhook = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const rawBody = request.rawBody ?? Buffer.from(JSON.stringify(request.body ?? {}), "utf-8");
    const signature = request.headers["stripe-signature"]?.toString();

    reply.status(200).send(await this.paymentsService.handleStripeWebhook({
      rawBody,
      ...(signature === undefined ? {} : { signature }),
    }));
  };
}
