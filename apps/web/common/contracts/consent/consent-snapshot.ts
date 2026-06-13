import { CONSENT_SNAPSHOT_UNKNOWN } from "@/common/constants/consent/consent-snapshot-unknown";
import type { ConsentChoice } from "@/common/contracts/consent/consent-choice";

export type ConsentSnapshot =
  | ConsentChoice
  | null
  | typeof CONSENT_SNAPSHOT_UNKNOWN;
