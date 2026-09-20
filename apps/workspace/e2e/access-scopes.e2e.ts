import { expect, test } from "@playwright/test";

const emptyStorageState = { cookies: [], origins: [] };
const customerMemberState =
  process.env.E2E_CUSTOMER_MEMBER_STORAGE_STATE ?? emptyStorageState;
const projectMemberState =
  process.env.E2E_PROJECT_MEMBER_STORAGE_STATE ?? emptyStorageState;

const allowedCustomerId = process.env.E2E_ALLOWED_CUSTOMER_ID;
const deniedCustomerId = process.env.E2E_DENIED_CUSTOMER_ID;
const allowedProjectId = process.env.E2E_ALLOWED_PROJECT_ID;
const deniedProjectId = process.env.E2E_DENIED_PROJECT_ID;

test.describe("customer-scoped member", () => {
  test.use({ storageState: customerMemberState });

  test.beforeEach(() => {
    test.skip(
      typeof customerMemberState !== "string" ||
        !allowedCustomerId ||
        !deniedCustomerId,
      "Configure the customer-scoped Clerk session and fixture IDs.",
    );
  });

  test("can open its customer but receives 404 for another customer", async ({
    page,
  }) => {
    const allowed = await page.goto(`/de/crm?cockpit=${allowedCustomerId}`);
    expect(allowed?.status()).toBe(200);

    const deniedPage = await page.goto(`/de/crm?cockpit=${deniedCustomerId}`);
    expect(deniedPage?.status()).toBe(404);

    const deniedApi = await page.request.get(
      `/api/workspace/crm/customers/${deniedCustomerId}`,
    );
    expect(deniedApi.status()).toBe(404);
  });
});

test.describe("project-scoped read-only member", () => {
  test.use({ storageState: projectMemberState });

  test.beforeEach(() => {
    test.skip(
      typeof projectMemberState !== "string" ||
        !allowedCustomerId ||
        !allowedProjectId ||
        !deniedProjectId,
      "Configure the project-scoped Clerk session and fixture IDs.",
    );
  });

  test("sees only its project in the scoped customer project list", async ({
    page,
  }) => {
    const customer = await page.goto(`/de/crm?cockpit=${allowedCustomerId}`);
    expect(customer?.status()).toBe(200);

    const projectsResponse = await page.request.get(
      `/api/workspace/crm/customers/${allowedCustomerId}/projects`,
    );
    expect(projectsResponse.status()).toBe(200);
    const body = (await projectsResponse.json()) as {
      projects: { id: string }[];
    };
    expect(body.projects.map((project) => project.id)).toContain(
      allowedProjectId,
    );
    expect(body.projects.map((project) => project.id)).not.toContain(
      deniedProjectId,
    );
  });

  test("receives 403 when writing its visible project without write access", async ({
    page,
  }) => {
    const response = await page.request.patch(
      `/api/workspace/crm/projects/${allowedProjectId}`,
      { data: {} },
    );
    expect(response.status()).toBe(403);
  });
});
