import { config as loadDotenv } from "dotenv";
import { expect, test } from "@playwright/test";
import { neon } from "@neondatabase/serverless";

loadDotenv({ path: ".env.local", override: false, quiet: true });
loadDotenv({ path: ".env.development.local", override: false, quiet: true });

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
      SELECT
        leads.email,
        leads.full_name AS "fullName",
        leads.inquiry_type AS "inquiryType",
        leads.mail_status AS "mailStatus",
        leads.source_form AS "sourceForm",
        lead_project_requests.goal_key AS "goalKey"
      FROM leads
      LEFT JOIN lead_project_requests
        ON lead_project_requests.lead_id = leads.id
      WHERE leads.email = $1
      ORDER BY leads.created_at DESC
      LIMIT 1
    `,
    [email],
  );

  return rows[0] ?? null;
}

test.describe("contact lead persistence", () => {
  test("submits the project request form and persists the lead in Neon", async ({
    page,
  }) => {
    test.skip(!sql, "DATABASE_URL is not configured for E2E verification.");

    const uniqueId = Date.now();
    const email = `lead-e2e-${uniqueId}@example.com`;

    await deleteLeadByEmail(email);

    await page.goto("/de");
    await page.locator("#contact").scrollIntoViewIfNeeded();

    await page.locator('input[name="fullName"]').fill("Lead E2E");
    await page.locator('input[name="email"]').fill(email);
    await page.locator('select[name="offerKey"]').selectOption("landing");
    await page
      .getByRole("button", { name: "Weiter zu Projektdetails" })
      .click();

    await page.locator('select[name="goalKey"]').selectOption("generate_inquiries");
    await page
      .locator('textarea[name="projectDetails"]')
      .fill("E2E-Test fuer die Lead-Persistierung in Neon.");
    await page
      .getByRole("button", { name: "Weiter zu Rahmen & Versand" })
      .click();

    await page.locator('input[name="company"]').fill("Invessiv Test");
    await page.locator('input[name="role"]').fill("QA");
    await page.locator('input[name="consent"]').check();
    await page.getByRole("button", { name: "Anfrage senden" }).click();

    await expect(
      page.getByText("Danke. Deine Anfrage wurde erfolgreich gesendet."),
    ).toBeVisible();

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

    await expect
      .poll(async () => {
        const lead = await getLeadByEmail(email);
        return lead?.mailStatus ?? null;
      }, {
        message: "Expected the lead mail status to be updated to sent.",
        timeout: 30_000,
      })
      .toBe("sent");

    await deleteLeadByEmail(email);
  });
});
