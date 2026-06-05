import "server-only";
import {
  LINKEDIN_POST_DELIVERY_USAGE_LIMIT_MAX,
  LINKEDIN_POST_DELIVERY_USAGE_LIMIT_SCOPE,
  LINKEDIN_POST_DELIVERY_USAGE_LIMIT_WINDOW_MS,
  LinkedInPostGeneratorUsageLimitUnavailableReason,
} from "@invessiv/common/constants/generator";
import type {
  GeneratorUsageLimitReservation,
  GeneratorUsageLimitStore,
} from "@invessiv/common/contracts/generator";
import {
  GeneratorUsageLimitUnavailableError,
  linkedinPostGeneratorUsageKeyService,
} from "@/server/linkedin-post/linkedin-post-generator-usage-key-service";
import { databaseGeneratorUsageLimitStore } from "@/server/linkedin-post/linkedin-post-generator-usage-limit-store";

/**
 * Anti-abuse rate-limit for the gated deliver step. Shares the IP-key mechanic
 * and the per-key counter table with the generator, but on a SEPARATE scope so
 * the generation budget stays untouched (a different scope yields a different
 * key hash → an independent counter row). The cap/window come from the delivery
 * constants.
 */

async function reserveLinkedInPostDeliveryUsage(
  headers: Headers,
  store: GeneratorUsageLimitStore = databaseGeneratorUsageLimitStore,
  now = new Date(),
): Promise<GeneratorUsageLimitReservation> {
  const ip =
    linkedinPostGeneratorUsageKeyService.getGeneratorRequestIp(headers);

  if (!ip) {
    throw new GeneratorUsageLimitUnavailableError(
      LinkedInPostGeneratorUsageLimitUnavailableReason.RequestIpMissing,
    );
  }

  const keyHash =
    linkedinPostGeneratorUsageKeyService.createGeneratorUsageKeyHash(
      ip,
      linkedinPostGeneratorUsageKeyService.getUsageLimitSecret(),
      LINKEDIN_POST_DELIVERY_USAGE_LIMIT_SCOPE,
    );

  return store.reserve({
    keyHash,
    limit: LINKEDIN_POST_DELIVERY_USAGE_LIMIT_MAX,
    now,
    windowMs: LINKEDIN_POST_DELIVERY_USAGE_LIMIT_WINDOW_MS,
  });
}

async function releaseLinkedInPostDeliveryUsage(
  reservation: Extract<GeneratorUsageLimitReservation, { allowed: true }>,
  store: GeneratorUsageLimitStore = databaseGeneratorUsageLimitStore,
) {
  await store.release({
    keyHash: reservation.keyHash,
    resetAt: reservation.resetAt,
  });
}

export const linkedinPostDeliveryRateLimitService = {
  releaseLinkedInPostDeliveryUsage,
  reserveLinkedInPostDeliveryUsage,
} as const;
