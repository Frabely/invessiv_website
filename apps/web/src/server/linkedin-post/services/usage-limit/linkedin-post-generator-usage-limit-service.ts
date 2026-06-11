import "server-only";
import {
  LINKEDIN_POST_GENERATOR_USAGE_LIMIT_MAX,
  LINKEDIN_POST_GENERATOR_USAGE_LIMIT_WINDOW_MS,
  LinkedInPostGeneratorUsageLimitUnavailableReason,
} from "@invessiv/common/constants/generator";
import type {
  GeneratorUsageLimitReservation,
  GeneratorUsageLimitSnapshot,
  GeneratorUsageLimitStore,
} from "@invessiv/common/contracts/generator";
import {
  GeneratorUsageLimitUnavailableError,
  linkedinPostGeneratorUsageKeyService,
} from "./linkedin-post-generator-usage-key-service";
import { databaseGeneratorUsageLimitStore } from "./linkedin-post-generator-usage-limit-store";

function toUsageLimitSnapshot(
  reservation: Pick<GeneratorUsageLimitReservation, "limit" | "remaining"> & {
    resetAt: Date;
  },
): GeneratorUsageLimitSnapshot {
  return {
    limit: reservation.limit,
    remaining: reservation.remaining,
    resetAt: reservation.resetAt.toISOString(),
  };
}

async function reserveLinkedInPostGeneratorUsage(
  headers: Headers,
  store: GeneratorUsageLimitStore = databaseGeneratorUsageLimitStore,
  now = new Date(),
) {
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
    );

  return store.reserve({
    keyHash,
    limit: LINKEDIN_POST_GENERATOR_USAGE_LIMIT_MAX,
    now,
    windowMs: LINKEDIN_POST_GENERATOR_USAGE_LIMIT_WINDOW_MS,
  });
}

async function releaseLinkedInPostGeneratorUsage(
  reservation: Extract<GeneratorUsageLimitReservation, { allowed: true }>,
  store: GeneratorUsageLimitStore = databaseGeneratorUsageLimitStore,
) {
  await store.release({
    keyHash: reservation.keyHash,
    resetAt: reservation.resetAt,
  });
}

export const linkedinPostGeneratorUsageLimitService = {
  releaseLinkedInPostGeneratorUsage,
  reserveLinkedInPostGeneratorUsage,
  toUsageLimitSnapshot,
} as const;
