import type {
  LinkedInPostBodyVariant,
  LinkedInPostGeneratorColorPairDto,
  LinkedInPostGeneratorTemplateDto,
} from "@/common/contracts";

export type LinkedInPostGeneratorPostDto = {
  headlineHtml: string;
  headlinePlain: string;
  bodyVariant: LinkedInPostBodyVariant;
  insight: string | null;
  bullets: string[] | null;
  highlight: string | null;
  authorName: string;
  expertiseDisplay: string;
  colorPair: LinkedInPostGeneratorColorPairDto;
  template: LinkedInPostGeneratorTemplateDto;
};
