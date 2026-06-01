export type GeneratorUsageLimitReservation =
  | {
      allowed: true;
      keyHash: string;
      limit: number;
      remaining: number;
      resetAt: Date;
    }
  | {
      allowed: false;
      limit: number;
      remaining: 0;
      resetAt: Date;
    };
