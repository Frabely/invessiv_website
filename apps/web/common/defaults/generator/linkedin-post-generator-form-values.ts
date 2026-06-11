import { GENERATOR_COLOR_AUTO } from "@/common/constants/generator/post/generator-color-pairs";
import type { LinkedInPostGeneratorFormValues } from "@/common/contracts/generator/linkedin-post-generator-form-values";
import { LinkedInPostTone } from "@/common/contracts/generator/linkedin-post-generator-tone";

export const DEFAULT_LINKEDIN_POST_GENERATOR_FORM_VALUES: LinkedInPostGeneratorFormValues =
  {
    topic: "",
    expertise: "",
    tone: LinkedInPostTone.Personal,
    colorPairId: GENERATOR_COLOR_AUTO,
    displayName: "",
    email: "",
    consent: false,
    company: "",
  };
