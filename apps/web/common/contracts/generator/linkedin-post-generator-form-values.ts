import type { LinkedInPostTone } from "@/common/contracts";

export type LinkedInPostGeneratorFormValues = {
  topic: string;
  expertise: string;
  tone: LinkedInPostTone;
  colorPairId: string;
  displayName: string;
  email: string;
  consent: boolean;
  company: string;
};
