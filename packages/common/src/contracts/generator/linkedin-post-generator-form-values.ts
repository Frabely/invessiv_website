import {
  LinkedInPostTone,
  type LinkedInPostTone as LinkedInPostToneType,
} from "./linkedin-post-generator-tone";

export type LinkedInPostGeneratorFormValues = {
  topic: string;
  expertise: string;
  tone: LinkedInPostToneType;
  email: string;
  consent: boolean;
  company: string;
};

export const LINKEDIN_POST_GENERATOR_INITIAL_VALUES: LinkedInPostGeneratorFormValues =
  {
    topic: "",
    expertise: "",
    tone: LinkedInPostTone.Personal,
    email: "",
    consent: false,
    company: "",
  };
