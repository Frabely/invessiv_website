import { config as loadDotenv } from "dotenv";
import { expect, test } from "@playwright/test";
import { neon } from "@neondatabase/serverless";

loadDotenv({ path: ".env.local", override: false, quiet: true });
loadDotenv({ path: ".env.development.local", override: false, quiet: true });
loadDotenv({ path: ".env.production.local", override: false, quiet: true });

const databaseUrl =
  process.env.DATABASE_URL ||
  process.env.INVESSIV_DATABASE_DATABASE_URL ||
  process.env.INVESSIV_DATABASE_POSTGRES_URL ||
  process.env.POSTGRES_URL;

const sql = databaseUrl ? neon(databaseUrl) : null;

async function deleteLeadByEmail(email: string) {
  if (!sql) {
    throw new Error("DATABASE_URL is not configured for the E2E lead test.");
  }

  await sql.query("DELETE FROM leads WHERE email = $1", [email]);
}

async function getLeadByEmail(email: string) {
  if (!sql) {
    throw new Error("DATABASE_URL is not configured for the E2E lead test.");
  }

  const rows = await sql.query(
    `
            SELECT leads.email,
                   leads.display_name               AS "displayName",
                   lead_submissions.channel         AS "sourceForm",
                   lead_email_contacts.message      AS "message",
                   lead_call_contacts.project_scope AS "projectScope"
            FROM leads
                     LEFT JOIN lead_submissions
                               ON lead_submissions.lead_id = leads.id
                     LEFT JOIN lead_email_contacts
                               ON lead_email_contacts.lead_submission_id = lead_submissions.id
                     LEFT JOIN lead_call_contacts
                               ON lead_call_contacts.lead_submission_id = lead_submissions.id
            WHERE leads.email = $1
            ORDER BY lead_submissions.created_at DESC LIMIT 1
        `,
    [email],
  );

  return rows[0] ?? null;
}

test.describe("contact lead persistence", () => {
  test("sends the contact form as an email and persists the lead in Neon", async ({
    page,
  }, testInfo) => {
    testInfo.setTimeout(90_000);
    test.skip(!sql, "DATABASE_URL is not configured for E2E verification.");

    const uniqueId = Date.now();
    const email = `lead-e2e-${uniqueId}@example.com`;
    const message = "E2E-Test fuer die Lead-Persistierung in Neon.";

    await deleteLeadByEmail(email);

    await page.goto("/de");
    await page.locator("#contact").scrollIntoViewIfNeeded();

    await page.locator('input[name="displayName"]').fill("Lead E2E");
    await page.locator('input[name="email"]').fill(email);
    await page.getByRole("radio", { name: "Kompakte Website" }).check();
    await page.locator('textarea[name="message"]').fill(message);
    await page.locator('input[name="consentAccepted"]').check();
    await page.getByRole("button", { name: "Anfrage senden" }).click();

    await expect(
      page.getByText("Anfrage gesendet.", { exact: false }),
    ).toBeVisible({
      timeout: 45_000,
    });

    await expect
      .poll(async () => getLeadByEmail(email), {
        message: "Expected the submitted contact lead to be written to Neon.",
        timeout: 30_000,
      })
      .toMatchObject({
        email,
        displayName: "Lead E2E",
        message: `Leistungsmodell: Kompakte Website\n\n${message}`,
        sourceForm: "quick_contact",
      });

    await deleteLeadByEmail(email);
  });

  test("persists the selected scope before opening Calendly", async ({
    page,
  }, testInfo) => {
    testInfo.setTimeout(90_000);
    test.skip(!sql, "DATABASE_URL is not configured for E2E verification.");

    const uniqueId = Date.now();
    const email = `call-e2e-${uniqueId}@example.com`;
    const message = "E2E-Test fuer den Projektrahmen im Erstgespraech.";

    await deleteLeadByEmail(email);
    await page.context().route("https://calendly.com/**", async (route) => {
      await route.fulfill({ body: "Calendly test page", status: 200 });
    });

    await page.goto("/de");
    await page.locator("#contact").scrollIntoViewIfNeeded();

    await page.locator('input[name="displayName"]').fill("Call E2E");
    await page.locator('input[name="email"]').fill(email);
    await page.getByRole("radio", { name: "Business Website" }).check();
    await page.locator('textarea[name="message"]').fill(message);
    await page.locator('input[name="consentAccepted"]').check();

    const popupPromise = page.waitForEvent("popup");
    await page
      .getByRole("button", { name: "Weiter zur Terminauswahl" })
      .click();
    const popup = await popupPromise;

    await expect
      .poll(async () => getLeadByEmail(email), {
        message: "Expected the discovery call to be written to Neon.",
        timeout: 30_000,
      })
      .toMatchObject({
        displayName: "Call E2E",
        email,
        message,
        projectScope: "business_website",
        sourceForm: "discovery_call",
      });

    await popup.waitForURL(/calendly\.com/);
    const calendlyUrl = new URL(popup.url());
    expect(calendlyUrl.searchParams.get("a1")).toBe(message);
    expect(calendlyUrl.searchParams.get("a2")).toBe("Business Website");

    await popup.close();
    await deleteLeadByEmail(email);
  });
});
