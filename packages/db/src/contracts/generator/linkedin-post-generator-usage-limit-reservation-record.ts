export type LinkedInPostGeneratorUsageLimitReservationRecord =
  | {
      allowed: true;
      key_hash: string;
      limit: number;
      remaining: number;
      reset_at: Date;
    }
  | {
      allowed: false;
      limit: number;
      remaining: 0;
      reset_at: Date;
    };
