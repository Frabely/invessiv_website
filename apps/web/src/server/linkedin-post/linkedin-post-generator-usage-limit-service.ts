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
  releaseLinkedInPostGeneratorUsageLimit,
  reserveLinkedInPostGeneratorUsageLimit,
} from "@invessiv/db/linkedin-post/reserve-linkedin-post-generator-usage-limit";
import {
  GeneratorUsageLimitUnavailableError,
  linkedinPostGeneratorUsageKeyService,
} from "@/server/linkedin-post/linkedin-post-generator-usage-key-service";

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

const databaseGeneratorUsageLimitStore: GeneratorUsageLimitStore = {
  async reserve({ keyHash, limit, now, windowMs }) {
    const result = await reserveLinkedInPostGeneratorUsageLimit({
      key_hash: keyHash,
      limit,
      now,
      window_ms: windowMs,
    });

    if (!result.persisted) {
      throw new GeneratorUsageLimitUnavailableError(
        LinkedInPostGeneratorUsageLimitUnavailableReason.StorageUnavailable,
      );
    }

    if (result.allowed) {
      return {
        allowed: true,
        keyHash: result.key_hash,
        limit: result.limit,
        remaining: result.remaining,
        resetAt: result.reset_at,
      };
    }

    return {
      allowed: false,
      limit: result.limit,
      remaining: result.remaining,
      resetAt: result.reset_at,
    };
  },

  async release({ keyHash, resetAt }) {
    await releaseLinkedInPostGeneratorUsageLimit({
      key_hash: keyHash,
      reset_at: resetAt,
    });
  },
};

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

export { GeneratorUsageLimitUnavailableError };
