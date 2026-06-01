import "server-only";
import { and, eq, gt, lt, lte, or, sql } from "drizzle-orm";
import {
  getDrizzleDatabaseClient,
  hasDatabaseConnectionString,
} from "@invessiv/db/core";
import type { LinkedInPostGeneratorUsageLimitReleaseInput } from "@invessiv/db/contracts/generator/linkedin-post-generator-usage-limit-release-input";
import type { LinkedInPostGeneratorUsageLimitReserveInput } from "@invessiv/db/contracts/generator/linkedin-post-generator-usage-limit-reserve-input";
import type { LinkedInPostGeneratorUsageLimitReserveResult } from "@invessiv/db/contracts/generator/linkedin-post-generator-usage-limit-reserve-result";
import { linkedinPostGeneratorUsageLimits } from "@invessiv/db/record-configuration/linkedin-post-generator-usage-limits";

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

export async function reserveLinkedInPostGeneratorUsageLimit(
  input: LinkedInPostGeneratorUsageLimitReserveInput,
): Promise<LinkedInPostGeneratorUsageLimitReserveResult> {
  if (!hasDatabaseConnectionString()) {
    return { persisted: false };
  }

  const db = getDrizzleDatabaseClient();
  const resetAt = new Date(input.now.getTime() + input.window_ms);
  const reservedRows = await db
    .insert(linkedinPostGeneratorUsageLimits)
    .values({
      created_at: input.now,
      key_hash: input.key_hash,
      successful_generations: 1,
      updated_at: input.now,
      window_reset_at: resetAt,
      window_started_at: input.now,
    })
    .onConflictDoUpdate({
      set: {
        successful_generations: sql`
                    case
            when
                    ${linkedinPostGeneratorUsageLimits.window_reset_at}
                    <=
                    ${input.now}
                    then
                    1
                    else
                    ${linkedinPostGeneratorUsageLimits.successful_generations}
                    +
                    1
                    end
                `,
        updated_at: input.now,
        window_reset_at: sql`
                    case
            when
                    ${linkedinPostGeneratorUsageLimits.window_reset_at}
                    <=
                    ${input.now}
                    then
                    ${resetAt}
                    else
                    ${linkedinPostGeneratorUsageLimits.window_reset_at}
                    end
                `,
        window_started_at: sql`
                    case
            when
                    ${linkedinPostGeneratorUsageLimits.window_reset_at}
                    <=
                    ${input.now}
                    then
                    ${input.now}
                    else
                    ${linkedinPostGeneratorUsageLimits.window_started_at}
                    end
                `,
      },
      target: linkedinPostGeneratorUsageLimits.key_hash,
      setWhere: or(
        lte(linkedinPostGeneratorUsageLimits.window_reset_at, input.now),
        lt(
          linkedinPostGeneratorUsageLimits.successful_generations,
          input.limit,
        ),
      ),
    })
    .returning({
      successful_generations:
        linkedinPostGeneratorUsageLimits.successful_generations,
      window_reset_at: linkedinPostGeneratorUsageLimits.window_reset_at,
    });

  const reserved = reservedRows[0];
  if (reserved) {
    return {
      allowed: true,
      key_hash: input.key_hash,
      limit: input.limit,
      persisted: true,
      remaining: Math.max(0, input.limit - reserved.successful_generations),
      reset_at: toDate(reserved.window_reset_at),
    };
  }

  const blockedRows = await db
    .select({
      successful_generations:
        linkedinPostGeneratorUsageLimits.successful_generations,
      window_reset_at: linkedinPostGeneratorUsageLimits.window_reset_at,
    })
    .from(linkedinPostGeneratorUsageLimits)
    .where(eq(linkedinPostGeneratorUsageLimits.key_hash, input.key_hash))
    .limit(1);
  const blocked = blockedRows[0];

  return {
    allowed: false,
    limit: input.limit,
    persisted: true,
    remaining: 0,
    reset_at: blocked ? toDate(blocked.window_reset_at) : resetAt,
  };
}

export async function releaseLinkedInPostGeneratorUsageLimit(
  input: LinkedInPostGeneratorUsageLimitReleaseInput,
) {
  if (!hasDatabaseConnectionString()) {
    return { persisted: false };
  }

  const db = getDrizzleDatabaseClient();
  await db
    .update(linkedinPostGeneratorUsageLimits)
    .set({
      successful_generations: sql`greatest
            (
            ${linkedinPostGeneratorUsageLimits.successful_generations}
            -
            1,
            0
            )`,
      updated_at: sql`now
            ()`,
    })
    .where(
      and(
        eq(linkedinPostGeneratorUsageLimits.key_hash, input.key_hash),
        eq(linkedinPostGeneratorUsageLimits.window_reset_at, input.reset_at),
        gt(linkedinPostGeneratorUsageLimits.successful_generations, 0),
      ),
    );

  return { persisted: true };
}
