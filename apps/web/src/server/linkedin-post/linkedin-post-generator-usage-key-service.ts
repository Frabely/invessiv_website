import "server-only";
import { createHmac } from "node:crypto";
import {
  LINKEDIN_POST_GENERATOR_USAGE_LIMIT_SCOPE,
  LinkedInPostGeneratorUsageLimitUnavailableReason,
} from "@invessiv/common/constants/generator";

export class GeneratorUsageLimitUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = GeneratorUsageLimitUnavailableError.name;
  }
}

function getUsageLimitSecret() {
  const secret = process.env.GENERATOR_USAGE_LIMIT_SECRET?.trim();

  if (!secret) {
    throw new GeneratorUsageLimitUnavailableError(
      LinkedInPostGeneratorUsageLimitUnavailableReason.SecretMissing,
    );
  }

  return secret;
}

function normalizeIp(rawIp: string) {
  const ip = rawIp.trim().toLowerCase();

  if (ip.startsWith("[") && ip.includes("]")) {
    return ip.slice(1, ip.indexOf("]"));
  }

  if (/^\d{1,3}(?:\.\d{1,3}){3}:\d+$/u.test(ip)) {
    return ip.slice(0, ip.lastIndexOf(":"));
  }

  return ip;
}

function getGeneratorRequestIp(headers: Headers) {
  const forwardedFor = headers.get("x-forwarded-for");
  const candidate = forwardedFor?.split(",")[0]?.trim();

  if (candidate) {
    return normalizeIp(candidate);
  }

  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) {
    return normalizeIp(realIp);
  }

  return null;
}

function createGeneratorUsageKeyHash(
  ip: string,
  secret: string,
  scope: string = LINKEDIN_POST_GENERATOR_USAGE_LIMIT_SCOPE,
) {
  return createHmac("sha256", secret).update(`${scope}:${ip}`).digest("hex");
}

export const linkedinPostGeneratorUsageKeyService = {
  createGeneratorUsageKeyHash,
  getGeneratorRequestIp,
  getUsageLimitSecret,
} as const;
