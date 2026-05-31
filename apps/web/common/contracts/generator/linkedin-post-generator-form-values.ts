import {
  LinkedInPostTone,
  type LinkedInPostTone as LinkedInPostToneType,
} from "./linkedin-post-generator-tone";

export type LinkedInPostGeneratorFormValues = {
  topic: string;
  expertise: string;
  tone: LinkedInPostToneType;
  /** Predefined color-pair id, or "auto" to let the pipeline pick at random. */
  colorPairId: string;
  displayName: string;
  email: string;
  consent: boolean;
  company: string;
};

export const LINKEDIN_POST_GENERATOR_INITIAL_VALUES: LinkedInPostGeneratorFormValues =
  {
    topic: "",
    expertise: "",
    tone: LinkedInPostTone.Personal,
    colorPairId: "auto",
    displayName: "",
    email: "",
    consent: false,
    company: "",
  };
