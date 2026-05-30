import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { LINKEDIN_POST_BODY_VARIANT_VALUES } from "@/common/contracts/generator/linkedin-post-body-variant";
import {
  GENERATOR_TEMPLATE_AUTO,
  GENERATOR_TEMPLATES,
} from "@/common/constants";

describe("generator templates", () => {
  it("exposes the five predefined templates", () => {
    expect(GENERATOR_TEMPLATES).toHaveLength(5);
  });

  it("has unique ids", () => {
    const ids = GENERATOR_TEMPLATES.map((template) => template.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has unique skeleton files", () => {
    const files = GENERATOR_TEMPLATES.map((template) => template.file);
    expect(new Set(files).size).toBe(files.length);
  });

  it("references html skeleton files", () => {
    for (const template of GENERATOR_TEMPLATES) {
      expect(template.file).toMatch(/^template-[a-z-]+\.html$/);
    }
  });

  it("uses a known body variant for every template", () => {
    for (const template of GENERATOR_TEMPLATES) {
      expect(LINKEDIN_POST_BODY_VARIANT_VALUES).toContain(template.bodyVariant);
    }
  });

  it("covers both body variants across the set", () => {
    const variants = new Set(
      GENERATOR_TEMPLATES.map((template) => template.bodyVariant),
    );
    expect(variants).toEqual(new Set(LINKEDIN_POST_BODY_VARIANT_VALUES));
  });

  it("keeps the auto sentinel distinct from any template id", () => {
    const ids: string[] = GENERATOR_TEMPLATES.map((template) => template.id);
    expect(ids).not.toContain(GENERATOR_TEMPLATE_AUTO);
  });

  it("matches the templates-manifest.json exactly, preventing dual-source drift", () => {
    const manifestPath = join(
      process.cwd(),
      "project-skills",
      "linkedin-post-generator",
      "templates",
      "templates-manifest.json",
    );
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
      templates: { id: string; bodyVariant: string; file: string }[];
    };

    expect(GENERATOR_TEMPLATES).toHaveLength(manifest.templates.length);
    for (const [i, tpl] of GENERATOR_TEMPLATES.entries()) {
      expect(tpl.id).toBe(manifest.templates[i].id);
      expect(tpl.bodyVariant).toBe(manifest.templates[i].bodyVariant);
      expect(tpl.file).toBe(manifest.templates[i].file);
    }
  });
});
