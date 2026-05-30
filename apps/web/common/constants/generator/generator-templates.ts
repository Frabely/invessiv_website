import type { LinkedInPostBodyVariant as LinkedInPostBodyVariantType } from "@invessiv/common/contracts/generator/linkedin-post-body-variant";
import { LinkedInPostBodyVariant } from "@invessiv/common/contracts/generator/linkedin-post-body-variant";

/**
 * Predefined structural post templates for the generated LinkedIn post. Each
 * template is a purely structural skeleton (no baked copy) that fixes the
 * background style, the copy arrangement, and the body form. Mirrors the
 * canonical set in the linkedin-post-generator skill
 * (templates/templates-manifest.json). `auto` lets the pipeline pick one at
 * random (default behaviour) — template choice is decoupled from tone.
 */
export const GENERATOR_TEMPLATE_AUTO = "auto";

export type GeneratorTemplate = {
  id: string;
  bodyVariant: LinkedInPostBodyVariantType;
  supportsHighlight: boolean;
  file: string;
};

export const GENERATOR_TEMPLATES = [
  {
    id: "editorial-center",
    bodyVariant: LinkedInPostBodyVariant.Insight,
    supportsHighlight: true,
    file: "template-editorial-center.html",
  },
  {
    id: "left-rail",
    bodyVariant: LinkedInPostBodyVariant.Insight,
    supportsHighlight: true,
    file: "template-left-rail.html",
  },
  {
    id: "statement",
    bodyVariant: LinkedInPostBodyVariant.Insight,
    supportsHighlight: false,
    file: "template-statement.html",
  },
  {
    id: "bullet-stack",
    bodyVariant: LinkedInPostBodyVariant.Bullets,
    supportsHighlight: false,
    file: "template-bullet-stack.html",
  },
  {
    id: "index-checklist",
    bodyVariant: LinkedInPostBodyVariant.Bullets,
    supportsHighlight: false,
    file: "template-index-checklist.html",
  },
] as const satisfies readonly GeneratorTemplate[];
