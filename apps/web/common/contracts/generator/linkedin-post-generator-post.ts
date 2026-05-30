import type { LinkedInPostBodyVariant } from "@invessiv/common/contracts/generator/linkedin-post-body-variant";
import type { LinkedInPostGeneratorColorPairDto } from "./linkedin-post-generator-color-pair";
import type { LinkedInPostGeneratorTemplateDto } from "./linkedin-post-generator-template";

export type LinkedInPostGeneratorPostDto = {
  headlineHtml: string;
  headlinePlain: string;
  bodyVariant: LinkedInPostBodyVariant;
  insight: string | null;
  bullets: string[] | null;
  highlight: string | null;
  expertiseDisplay: string;
  colorPair: LinkedInPostGeneratorColorPairDto;
  template: LinkedInPostGeneratorTemplateDto;
};
