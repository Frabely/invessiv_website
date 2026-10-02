import { expect, type Page, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import {
  type PortalE2eFixture,
  portalE2ePaths,
} from "./support/portal-e2e-fixture";

const FORMS = "/api/workspace/crm/onboarding/forms";

type Block = { id: string; version: number; fields: { id: string }[] };
type Form = {
  id: string;
  status: string;
  version: number;
  blocks: { block: Block }[];
  answers: { value: string | null }[];
  groupEntries: unknown[];
  answerFiles: unknown[];
};

let fixture: PortalE2eFixture;

/** Every optional setting of a field left empty; the test only varies type, level and requirement. */
function fieldRequest(
  key: string,
  label: string,
  type: string,
  expectedBlockVersion: number,
  overrides: { required?: boolean; parentFieldId?: string } = {},
) {
  return {
    key,
    type,
    parentFieldId: overrides.parentFieldId ?? null,
    requirement: overrides.required ? "required" : "optional",
    maxLength: null,
    minItems: null,
    maxItems: null,
    acceptedAssetKinds: null,
    prefillSource: null,
    conditionFieldId: null,
    conditionChoiceId: null,
    translations: { de: { label, help: null } },
    choices: [],
    expectedBlockVersion,
  };
}

/**
 * Builds the draft through the API: the structure editor has its own tests, this flow is about
 * release, filling in and submitting. One block with a text, a group with a sub-field and a files
 * field, the text and the files required.
 */
async function startDraft(page: Page, projectId: string, suffix: string) {
  const started = await page.request.post(
    `/api/workspace/crm/projects/${projectId}/onboarding`,
    { data: { templateId: null } },
  );
  expect(started.status()).toBe(201);
  const draft = (await started.json()) as Form;

  const withBlock = await page.request.post(`${FORMS}/${draft.id}/blocks`, {
    data: {
      key: `e2e_${suffix}`,
      translations: { de: { title: `Unternehmen ${suffix}`, intro: null } },
      expectedFormVersion: draft.version,
    },
  });
  expect(withBlock.status()).toBe(201);
  let block = ((await withBlock.json()) as Form).blocks[0].block;

  const addField = async (body: ReturnType<typeof fieldRequest>) => {
    const response = await page.request.post(
      `${FORMS}/${draft.id}/blocks/${block.id}/fields`,
      { data: body },
    );
    expect(response.status()).toBe(201);
    block = (await response.json()) as Block;
  };
  await addField(
    fieldRequest("company", "Firmenname", "short_text", block.version, {
      required: true,
    }),
  );
  await addField(fieldRequest("team", "Team", "group", block.version));
  const team = block.fields[1].id;
  await addField(
    fieldRequest("member", "Name der Person", "short_text", block.version, {
      parentFieldId: team,
    }),
  );
  await addField(
    fieldRequest("briefing", "Briefing", "files", block.version, {
      required: true,
    }),
  );
  return draft.id;
}

function isRequest(method: string, path: RegExp) {
  return (response: { url(): string; request(): { method(): string } }) =>
    path.test(response.url()) && response.request().method() === method;
}

/**
 * The core flow of the onboarding: the team starts and releases a form, a contact fills it in
 * with a group entry and an upload and submits it, and the team reads the answers.
 */
test.describe.serial("portal onboarding", () => {
  test.use({ storageState: portalE2ePaths.managerState });

  test.beforeAll(async () => {
    fixture = JSON.parse(
      await readFile(portalE2ePaths.fixture, "utf8"),
    ) as PortalE2eFixture;
  });

  test("releases a draft, lets a contact fill it in with a group and an upload, and submits it", async ({
    page,
    browser,
  }, testInfo) => {
    const suffix = Date.now().toString(36);
    const customer = fixture.feedbackCustomer;
    const formId = await startDraft(page, fixture.onboardingProject, suffix);
    const portalForm = `/de/portal/${customer}/onboarding/${formId}`;

    const contactContext = await browser.newContext({
      storageState: portalE2ePaths.feedbackContactState,
    });
    try {
      const contact = await contactContext.newPage();

      // A draft does not exist for the customer: no data, no page content, no widget. The page
      // streams behind the portal's loading state, so only the API can answer with the status.
      const draftApi = await contact.request.get(
        `/api/portal/${customer}/onboarding/${formId}`,
      );
      expect(draftApi.status()).toBe(404);
      await contact.goto(portalForm);
      await expect(
        contact.getByRole("heading", { name: `Unternehmen ${suffix}` }),
      ).toHaveCount(0);
      await expect(contact.getByRole("textbox")).toHaveCount(0);
      await contact.goto(`/de/portal/${customer}`);
      await expect(
        contact.getByRole("region", { name: "Onboarding" }),
      ).toHaveCount(0);

      await page.goto(`/de/crm/onboarding/${formId}`);
      await expect(page.getByText("Entwurf")).toBeVisible();
      await page.getByRole("button", { name: "Freigeben" }).click();
      const dialog = page.getByRole("dialog", { name: "Bogen freigeben?" });
      const released = page.waitForResponse(
        isRequest("POST", new RegExp(`/forms/${formId}/release$`)),
      );
      await dialog.getByRole("button", { name: "Freigeben" }).click();
      expect((await released).ok()).toBe(true);
      await expect(dialog).toBeHidden();
      await expect(page.getByText("Beim Kunden")).toBeVisible();
      await expect(page.getByRole("button", { name: "Freigeben" })).toHaveCount(
        0,
      );
      await expect(
        page.getByText("Der Kunde sieht jede Änderung am Aufbau sofort."),
      ).toBeVisible();

      // A second release is refused, whatever version the client read.
      const again = await page.request.post(`${FORMS}/${formId}/release`, {
        data: { expectedVersion: 1, acknowledgeWarnings: true },
      });
      expect(again.status()).toBe(409);

      // The widget leads the contact into the form.
      await contact.goto(`/de/portal/${customer}`);
      const widget = contact.getByRole("region", { name: "Onboarding" });
      await expect(widget.getByText("Du bist dran")).toBeVisible();
      await widget.getByRole("link", { name: /weiter ausfüllen/ }).click();
      await expect(contact).toHaveURL(new RegExp(`/onboarding/${formId}`));
      await expect(
        contact.getByRole("heading", { name: `Unternehmen ${suffix}` }),
      ).toBeVisible();

      const answerSaved = () =>
        contact.waitForResponse(
          isRequest("PUT", new RegExp(`/onboarding/${formId}/answers$`)),
        );
      let saved = answerSaved();
      const company = contact.getByRole("textbox", { name: /Firmenname/ });
      await company.fill(`Nordlicht ${suffix}`);
      await company.blur();
      expect((await saved).ok()).toBe(true);

      const entryCreated = contact.waitForResponse(
        isRequest("POST", new RegExp(`/onboarding/${formId}/group-entries$`)),
      );
      await contact.getByRole("button", { name: "Eintrag hinzufügen" }).click();
      expect((await entryCreated).ok()).toBe(true);
      const entry = contact.getByRole("group", { name: "Eintrag 1" });
      const member = entry.getByRole("textbox", { name: /Name der Person/ });
      // The focus is already in the new entry, so the contact can type at once.
      await expect(member).toBeFocused();
      saved = answerSaved();
      await member.fill(`Ada ${suffix}`);
      await member.blur();
      expect((await saved).ok()).toBe(true);

      const attached = contact.waitForResponse(
        isRequest("POST", new RegExp(`/onboarding/${formId}/files$`)),
      );
      await contact.locator('input[type="file"]').setInputFiles({
        name: `briefing-${suffix}.txt`,
        mimeType: "text/plain",
        buffer: Buffer.from(`Briefing ${suffix}`, "utf8"),
      });
      expect((await attached).ok()).toBe(true);
      await expect(
        contact.getByRole("list", { name: "Dateien zu „Briefing“" }),
      ).toContainText(`briefing-${suffix}.txt`);

      // A reload lands in the same step with everything that was saved.
      await contact.reload();
      await expect(
        contact.getByRole("textbox", { name: /Firmenname/ }),
      ).toHaveValue(`Nordlicht ${suffix}`);
      await expect(
        contact
          .getByRole("group", { name: "Eintrag 1" })
          .getByRole("textbox", { name: /Name der Person/ }),
      ).toHaveValue(`Ada ${suffix}`);
      await expect(
        contact.getByRole("list", { name: "Dateien zu „Briefing“" }),
      ).toContainText(`briefing-${suffix}.txt`);

      for (const viewport of [
        { name: "desktop", width: 1280, height: 900 },
        { name: "mobile", width: 360, height: 800 },
      ]) {
        await contact.setViewportSize(viewport);
        const overflow = await contact.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth,
        );
        expect(overflow).toBe(false);
        await contact.screenshot({
          path: testInfo.outputPath(`portal-onboarding-${viewport.name}.png`),
          fullPage: true,
        });
      }

      await contact
        .getByRole("button", { name: "Weiter", exact: true })
        .click();
      await expect(
        contact.getByText("Alle Pflichtangaben sind da. Du kannst absenden."),
      ).toBeVisible();
      await contact
        .getByRole("button", { name: "Onboarding absenden" })
        .click();
      await contact
        .getByRole("dialog", { name: "Onboarding absenden?" })
        .getByRole("button", { name: "Jetzt absenden" })
        .click();
      await expect(contact.getByText(/Abgesendet am/)).toBeVisible();
      await expect(contact.getByRole("textbox")).toHaveCount(0);
      await expect(contact.getByText(`Ada ${suffix}`)).toBeVisible();

      // A contact of another company gets nothing, whatever it guesses.
      const foreign = await contact.goto(
        `/de/portal/${fixture.filesCustomer}/onboarding/${formId}`,
      );
      expect(foreign?.status()).toBe(404);
    } finally {
      await contactContext.close();
    }

    const internal = await page.request.get(`${FORMS}/${formId}`);
    expect(internal.ok()).toBe(true);
    const form = (await internal.json()) as Form;
    expect(form.status).toBe("submitted");
    expect(form.answers.map((answer) => answer.value).sort()).toEqual(
      [`Ada ${suffix}`, `Nordlicht ${suffix}`].sort(),
    );
    expect(form.groupEntries).toHaveLength(1);
    expect(form.answerFiles).toHaveLength(1);

    await page.goto(`/de/crm/onboarding/${formId}?tab=answers`);
    // While the page streams in, the badge exists twice for a moment (hidden chunk and its place).
    await expect(
      page.getByRole("main").getByText("Abgesendet", { exact: true }).first(),
    ).toBeVisible();
    const answers = page.getByRole("tabpanel");
    await expect(answers.getByText(`Nordlicht ${suffix}`)).toBeVisible();
    await expect(answers.getByText("Eintrag 1")).toBeVisible();
    await expect(
      answers.getByRole("list", { name: "Dateien zu „Briefing“" }),
    ).toContainText(`briefing-${suffix}.txt`);
  });
});
