import path from "node:path";
import { config as loadDotenv } from "dotenv";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { SUPPORTED_LOCALES } from "@invessiv/common";
import { missingQuestionnaireLocales } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-translation";
import { findWorkspaceRoot, getDrizzleDatabaseClient } from "@invessiv/db/core";
import {
  questionnaireBlocks,
  questionnaireTemplates,
} from "@invessiv/db/record-configuration";
import { questionnaireDefinitionReadService } from "@/server/shared/services/questionnaire/questionnaire-definition-read-service";
import { questionnaireDefinitionValidation } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-definition-validation";
import { questionnaireTemplateService } from "@/server/workspace/crm/services/questionnaire/questionnaire-template-service";

vi.mock("server-only", () => ({}));

// The catalog introduced by 0048 was replaced in 0052 and extended in 0053.
const STANDARD = [
  "project_contacts",
  "project_services",
  "company_profile",
  "target_audience",
  "offers",
  "about_us",
  "team",
  "testimonials_references",
  "trust_signals",
  "faq",
  "texts_tone",
  "brand_assets",
  "brand_colors_fonts",
  "design_direction",
  "reference_websites",
  "media_assets",
  "existing_website",
  "search_visibility",
  "domain_services",
  "contact_social",
  "legal",
  "closing",
];
const EXTRA = [
  "blog_news",
  "careers",
  "products_pricing",
  "events",
  "downloads",
  "newsletter",
  "inquiry_forms",
  "campaign_ads",
  "languages",
];
const ALL_KEYS = [...STANDARD, ...EXTRA];

type Database = ReturnType<typeof getDrizzleDatabaseClient>;

describe.skipIf(process.env.CRM_DB_INTEGRATION !== "true")(
  "questionnaire standard catalog seed (migrations 0052 and 0053)",
  () => {
    let db: Database;

    beforeAll(() => {
      const workspaceRoot = findWorkspaceRoot(process.cwd());
      const loaded = loadDotenv({
        path: path.join(workspaceRoot, ".env.development.local"),
        quiet: true,
      });
      const databaseUrl =
        process.env.DATABASE_URL_DEVELOPMENT?.trim() ||
        loaded.parsed?.DATABASE_URL?.trim();
      if (!databaseUrl)
        throw new Error(
          "Development database URL is not configured for the standard catalog smoke.",
        );
      process.env.DATABASE_URL = databaseUrl;
      db = getDrizzleDatabaseClient();
    });

    async function catalogBlocks() {
      const rows = await db
        .select({ id: questionnaireBlocks.id, key: questionnaireBlocks.key })
        .from(questionnaireBlocks)
        .where(
          and(
            inArray(questionnaireBlocks.key, ALL_KEYS),
            isNull(questionnaireBlocks.owner_form_id),
          ),
        );
      return new Map(rows.map((row) => [row.key, row.id]));
    }

    it("has every block of the catalog in German and English, each passing the write-path rules", async () => {
      const ids = await catalogBlocks();
      expect([...ids.keys()].sort()).toEqual([...ALL_KEYS].sort());

      const blocks = await questionnaireDefinitionReadService.findBlocks(
        db,
        ALL_KEYS.map((key) => ids.get(key)!),
        null,
      );
      for (const block of blocks) {
        expect(Object.keys(block.translations).sort(), block.key).toEqual(
          [...SUPPORTED_LOCALES].sort(),
        );
        expect(missingQuestionnaireLocales(block), block.key).toEqual([]);
        expect(
          questionnaireDefinitionValidation.validateBlock(block),
          block.key,
        ).toBeNull();
        expect(block.fields.length, block.key).toBeGreaterThan(0);
      }
    });

    it("has the current Website-Onboarding template in the planned order without add-on blocks", async () => {
      const title = "Website-Onboarding";
      const keys = STANDARD;
      const ids = await catalogBlocks();
      const [row] = await db
        .select()
        .from(questionnaireTemplates)
        .where(eq(questionnaireTemplates.title, title));
      expect(row, title).toBeDefined();

      const template = await questionnaireTemplateService.toDto(db, row!);
      expect(template.blocks).toEqual(
        keys.map((key, position) => ({ blockId: ids.get(key), position })),
      );
    });
  },
);
