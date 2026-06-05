import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import {
  DeliveryTokenInvalidReason,
  LINKEDIN_POST_DELIVERY_TOKEN_TTL_MS,
} from "@/common/constants/generator";
import type {
  DeliveryTokenInput,
  DeliveryTokenPayload,
  DeliveryTokenVerifyResult,
} from "@/common/contracts/generator";

export class DeliveryTokenSecretMissingError extends Error {
  constructor() {
    super("GENERATOR_DELIVERY_TOKEN_SECRET is not configured.");
    this.name = DeliveryTokenSecretMissingError.name;
  }
}

function getDeliveryTokenSecret() {
  const secret = process.env.GENERATOR_DELIVERY_TOKEN_SECRET?.trim();

  if (!secret) {
    throw new DeliveryTokenSecretMissingError();
  }

  return secret;
}

function signPayload(payloadSegment: string, secret: string) {
  return createHmac("sha256", secret).update(payloadSegment).digest();
}

function createDeliveryToken(
  input: DeliveryTokenInput,
  now: number = Date.now(),
): string {
  const payload: DeliveryTokenPayload = {
    caption: input.caption,
    downloadFileName: input.downloadFileName,
    exp: now + LINKEDIN_POST_DELIVERY_TOKEN_TTL_MS,
    locale: input.locale,
    post: input.post,
  };

  const payloadSegment = Buffer.from(JSON.stringify(payload), "utf8").toString(
    "base64url",
  );
  const signatureSegment = signPayload(
    payloadSegment,
    getDeliveryTokenSecret(),
  ).toString("base64url");

  return `${payloadSegment}.${signatureSegment}`;
}

function signaturesMatch(expected: Buffer, providedSegment: string) {
  let provided: Buffer;
  try {
    provided = Buffer.from(providedSegment, "base64url");
  } catch {
    return false;
  }

  if (provided.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(provided, expected);
}

function parsePayload(payloadSegment: string): DeliveryTokenPayload | null {
  try {
    const decoded = Buffer.from(payloadSegment, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded) as DeliveryTokenPayload;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.exp !== "number" ||
      typeof parsed.caption !== "string" ||
      typeof parsed.downloadFileName !== "string" ||
      typeof parsed.locale !== "string" ||
      typeof parsed.post !== "object" ||
      parsed.post === null
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function verifyDeliveryToken(
  token: string,
  now: number = Date.now(),
): DeliveryTokenVerifyResult {
  const segments = token.split(".");
  if (segments.length !== 2 || !segments[0] || !segments[1]) {
    return { reason: DeliveryTokenInvalidReason.Malformed, valid: false };
  }

  const [payloadSegment, signatureSegment] = segments;
  const expectedSignature = signPayload(
    payloadSegment,
    getDeliveryTokenSecret(),
  );

  if (!signaturesMatch(expectedSignature, signatureSegment)) {
    return { reason: DeliveryTokenInvalidReason.Malformed, valid: false };
  }

  const payload = parsePayload(payloadSegment);
  if (!payload) {
    return { reason: DeliveryTokenInvalidReason.Malformed, valid: false };
  }

  if (payload.exp <= now) {
    return { reason: DeliveryTokenInvalidReason.Expired, valid: false };
  }

  return { payload, valid: true };
}

export const linkedinPostDeliveryTokenService = {
  createDeliveryToken,
  verifyDeliveryToken,
} as const;
