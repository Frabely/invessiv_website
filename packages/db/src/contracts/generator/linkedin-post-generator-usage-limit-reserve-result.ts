import type { LinkedInPostGeneratorUsageLimitReservationRecord } from "./linkedin-post-generator-usage-limit-reservation-record";

export type LinkedInPostGeneratorUsageLimitReserveResult =
  | {
      persisted: false;
    }
  | ({
      persisted: true;
    } & LinkedInPostGeneratorUsageLimitReservationRecord);
