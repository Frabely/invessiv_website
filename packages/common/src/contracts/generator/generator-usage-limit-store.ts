import type { GeneratorUsageLimitReservation } from "./generator-usage-limit-reservation";

export type GeneratorUsageLimitStore = {
  reserve(input: {
    keyHash: string;
    limit: number;
    now: Date;
    windowMs: number;
  }): Promise<GeneratorUsageLimitReservation>;
  release(input: { keyHash: string; resetAt: Date }): Promise<void>;
};
