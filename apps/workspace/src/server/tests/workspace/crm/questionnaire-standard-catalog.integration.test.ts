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
import { questionnaireDefinitionReadService } from "@/server/workspace/crm/services/questionnaire/questionnaire-definition-read-service";
import { questionnaireDefinitionValidation } from "@/server/workspace/crm/services/questionnaire/questionnaire-definition-validation";
import { questionnaireTemplateService } from "@/server/workspace/crm/services/questionnaire/questionnaire-template-service";

vi.mock("server-only", () => ({}));

// Plans/crm/15-questionnaire/64a-standardkatalog.md, section "Vorlagen".
const COMPACT = [
  "contacts_approvals",
  "project_services",
  "company_profile_compact",
  "offers_compact",
  "brand_compact",
  "design_compact",
  "images_assets",
  "contact_social",
  "domain_access",
  "legal",
  "rights_consent",
  "texts_misc_compact",
];
const FULL = [
  "contacts_approvals",
  "project_services",
  "company_profile",
  "target_audience",
  "offers",
  "brand_assets",
  "brand_colors_fonts",
  "design_direction",
  "reference_websites",
  "images_assets",
  "team",
  "social_proof",
  "about_us",
  "faq",
  "contact_social",
  "existing_website",
  "seo_basics",
  "domain_access",
  "integrations",
  "legal",
  "rights_consent",
  "texts_tone",
  "other_wishes",
];
const ALL_KEYS = [...new Set([...COMPACT, ...FULL])];

type Database = ReturnType<typeof getDrizzleDatabaseClient>;

describe.skipIf(process.env.CRM_DB_INTEGRATION !== "true")(
  "questionnaire standard catalog seed (migration 0048)",
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

    it.each([
      ["Landingpage kompakt", COMPACT],
      ["Landingpage ausführlich", FULL],
    ])("has the template %s in the planned order", async (title, keys) => {
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
