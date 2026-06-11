import "server-only";
import { LinkedInPostGeneratorUsageLimitUnavailableReason } from "@invessiv/common/constants/generator";
import type { GeneratorUsageLimitStore } from "@invessiv/common/contracts/generator";
import {
  releaseLinkedInPostGeneratorUsageLimit,
  reserveLinkedInPostGeneratorUsageLimit,
} from "@invessiv/db/linkedin-post/reserve-linkedin-post-generator-usage-limit";
import { GeneratorUsageLimitUnavailableError } from "./linkedin-post-generator-usage-key-service";

export const databaseGeneratorUsageLimitStore: GeneratorUsageLimitStore = {
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
