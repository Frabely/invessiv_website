import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { QuestionnaireFieldType as T } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import { QuestionnairePrefillSource } from "@invessiv/common/constants/crm/questionnaire/questionnaire-prefill-sources";
import { customers } from "@invessiv/db/record-configuration";
import { getProjectOnboarding } from "@/server/workspace/crm/query-handler/get-project-onboarding.query-handler";
import { startProjectOnboarding } from "@/server/workspace/crm/command-handler/start-project-onboarding.command-handler";
import { createOnboardingIntegrationFixture } from "./support/onboarding-integration-fixture";
import { fieldByKey } from "./support/questionnaire-definition-fixtures";

vi.mock("server-only", () => ({}));
vi.setConfig({ testTimeout: 60_000 });

describe.skipIf(process.env.CRM_DB_INTEGRATION !== "true")(
  "onboarding pre-fill respects the rights of the actor",
  () => {
    const f = createOnboardingIntegrationFixture();

    /** `projects.write` on one project only: no `customers.read`, no right on the sibling project. */
    const boundTo = (projectId: string) =>
      f.actor({
        permissions: new Set(),
        projectPermissions: new Map([
          [
            projectId,
            {
              customerId: f.customerId,
              permissions: new Set([
                Permission.ProjectsRead,
                Permission.ProjectsWrite,
              ]),
            },
          ],
        ]),
      });

    beforeAll(async () => {
      await f.setup();
    }, 60_000);

    afterAll(async () => {
      await f.cleanup();
    }, 60_000);

    it("does not copy answers of a sibling project the actor cannot read", async () => {
      const block = await f.catalogBlock(
        [{ key: "slogan", type: T.ShortText }],
        { carryOver: true },
      );
      const template = await f.template([block.id]);
      const sibling = f.value(
        await startProjectOnboarding(
          f.siblingProjectId,
          { templateId: template.id },
          f.member(),
        ),
      );
      await f.answer(
        sibling,
        fieldByKey(sibling.blocks[0]!.block, "slogan").id,
        { value: "Interner Claim des Schwesterprojekts" },
      );
      await f.setFormStatus(sibling.id, OnboardingFormStatus.Completed);

      const ownProject = await f.project();
      const form = f.value(
        await startProjectOnboarding(
          ownProject,
          { templateId: template.id },
          boundTo(ownProject),
        ),
      );

      expect(form.answers).toEqual([]);
    });

    it("hides that a source exists and still pre-fills for a role bound to the source project", async () => {
      const block = await f.catalogBlock(
        [{ key: "slogan", type: T.ShortText }],
        { carryOver: true },
      );
      const template = await f.template([block.id]);
      const sibling = f.value(
        await startProjectOnboarding(
          await f.project(),
          { templateId: template.id },
          f.member(),
        ),
      );
      await f.answer(
        sibling,
        fieldByKey(sibling.blocks[0]!.block, "slogan").id,
        { value: "Claim" },
      );
      await f.setFormStatus(sibling.id, OnboardingFormStatus.Completed);
      const ownProject = await f.project();

      expect(
        await getProjectOnboarding(ownProject, boundTo(ownProject)),
      ).toMatchObject({ prefillAvailable: false });
      expect(await getProjectOnboarding(ownProject, f.member())).toMatchObject({
        prefillAvailable: true,
      });

      const readsBoth = f.actor({
        permissions: new Set(),
        customerPermissions: new Map([
          [
            f.customerId,
            new Set([Permission.ProjectsRead, Permission.ProjectsWrite]),
          ],
        ]),
      });
      const form = f.value(
        await startProjectOnboarding(
          ownProject,
          { templateId: template.id },
          readsBoth,
        ),
      );
      expect(form.answers.map((answer) => answer.value)).toEqual(["Claim"]);
    });

    it("does not copy customer master data without the right to read the customer", async () => {
      await f
        .database()
        .update(customers)
        .set({ vat_id: "DE123456789", company_name: "Nordlicht GmbH" })
        .where(eq(customers.id, f.customerId));
      const block = await f.catalogBlock([
        {
          key: "vat",
          type: T.ShortText,
          overrides: {
            prefillSource: QuestionnairePrefillSource.CustomerVatId,
          },
        },
      ]);
      const template = await f.template([block.id]);
      const ownProject = await f.project();

      const form = f.value(
        await startProjectOnboarding(
          ownProject,
          { templateId: template.id },
          boundTo(ownProject),
        ),
      );

      expect(form.answers).toEqual([]);
    });
  },
);
