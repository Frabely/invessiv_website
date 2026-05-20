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
                   concat_ws(' ', leads.first_name, leads.last_name) AS "fullName",
                   lead_project_requests.offer_key                   AS "inquiryType",
                   lead_submissions.channel                          AS "sourceForm",
                   lead_project_requests.goal_key                    AS "goalKey"
            FROM leads
                     LEFT JOIN lead_submissions
                               ON lead_submissions.lead_id = leads.id
                     LEFT JOIN lead_project_requests
                               ON lead_project_requests.lead_submission_id = lead_submissions.id
            WHERE leads.email = $1
            ORDER BY lead_submissions.created_at DESC LIMIT 1
        `,
    [email],
  );

  return rows[0] ?? null;
}

test.describe("contact lead persistence", () => {
  test("submits the project request form and persists the lead in Neon", async ({
    page,
  }, testInfo) => {
    testInfo.setTimeout(90_000);
    test.skip(!sql, "DATABASE_URL is not configured for E2E verification.");

    const uniqueId = Date.now();
    const email = `lead-e2e-${uniqueId}@example.com`;

    await deleteLeadByEmail(email);

    await page.goto("/de");
    await page.locator("#contact").scrollIntoViewIfNeeded();

    await page.locator('input[name="firstName"]').fill("Lead");
    await page.locator('input[name="lastName"]').fill("E2E");
    await page.locator('input[name="email"]').fill(email);
    await page.locator('select[name="offerKey"]').selectOption("landing");
    await page
      .getByRole("button", { name: "Weiter zu Projektdetails" })
      .click();

    await page
      .locator('select[name="goalKey"]')
      .selectOption("generate_inquiries");
    await page
      .locator('textarea[name="projectDetails"]')
      .fill("E2E-Test fuer die Lead-Persistierung in Neon.");
    await page
      .getByRole("button", { name: "Weiter zu Rahmen & Versand" })
      .click();

    await page.locator('input[name="company"]').fill("Invessiv Test");
    await page.locator('input[name="role"]').fill("QA");
    await page.locator('input[name="consentAccepted"]').check();
    await page.getByRole("button", { name: "Anfrage senden" }).click();

    await expect(
      page.getByText("Danke. Deine Anfrage wurde erfolgreich gesendet."),
    ).toBeVisible({ timeout: 45_000 });

    await expect
      .poll(async () => getLeadByEmail(email), {
        message: "Expected the submitted contact lead to be written to Neon.",
        timeout: 30_000,
      })
      .toMatchObject({
        email,
        fullName: "Lead E2E",
        goalKey: "generate_inquiries",
        inquiryType: "landing",
        sourceForm: "project_request",
      });

    await deleteLeadByEmail(email);
  });
});
