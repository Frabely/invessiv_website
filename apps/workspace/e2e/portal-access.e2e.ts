import { type APIRequestContext, expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import {
  type PortalE2eFixture,
  portalE2ePaths,
} from "./support/portal-e2e-fixture";

const baseURL = "http://localhost:4174";
const emptyStorageState = { cookies: [], origins: [] };
let fixture: PortalE2eFixture;

type PortalAccess = {
  customerVersion: number;
  previewConfirmedAt: string | null;
  contacts: { assignmentId: string; displayName: string }[];
  roles: { id: string; systemKey: string | null; active: boolean }[];
  invitations: { id: string; assignmentId: string }[];
  memberships: { id: string; assignmentId: string; version: number }[];
};

async function getAccess(
  request: APIRequestContext,
  customerId: string,
): Promise<PortalAccess> {
  const response = await request.get(
    `/api/workspace/crm/customers/${customerId}/portal-access`,
  );
  expect(response.status()).toBe(HttpResponseCode.Ok);
  return ((await response.json()) as { access: PortalAccess }).access;
}

async function ensurePreview(
  request: APIRequestContext,
  customerId: string,
  access: PortalAccess,
) {
  if (access.previewConfirmedAt) return;
  const response = await request.post(
    `/api/workspace/crm/customers/${customerId}/portal-preview`,
    {
      data: { version: access.customerVersion },
    },
  );
  expect(response.status()).toBe(HttpResponseCode.Ok);
}

async function invite(
  request: APIRequestContext,
  customerId: string,
  assignmentId: string,
): Promise<{ url: string; roleId: string }> {
  const access = await getAccess(request, customerId);
  await ensurePreview(request, customerId, access);
  const roleId = access.roles.find(
    (role) => role.systemKey === "portal_standard" && role.active,
  )?.id;
  expect(roleId).toBeTruthy();
  const response = await request.post(
    `/api/workspace/crm/customers/${customerId}/portal-invitations?locale=de`,
    {
      data: {
        assignmentId,
        roleIds: [roleId],
        emailNotificationsEnabled: true,
      },
    },
  );
  expect(response.status()).toBe(HttpResponseCode.Created);
  const payload = (await response.json()) as { inviteUrl: string };
  return { url: payload.inviteUrl, roleId: roleId! };
}

function tokenFrom(url: string): string {
  return decodeURIComponent(new URL(url).pathname.split("/").at(-1) ?? "");
}

async function revokeActiveAccess(
  request: APIRequestContext,
  customerId: string,
  assignmentId: string,
) {
  const access = await getAccess(request, customerId);
  const membership = access.memberships.find(
    (item) => item.assignmentId === assignmentId,
  );
  if (!membership) return;
  const response = await request.delete(
    `/api/workspace/crm/portal-memberships/${membership.id}`,
  );
  expect(response.status()).toBe(HttpResponseCode.Ok);
}

async function revokeOpenInvitations(
  request: APIRequestContext,
  customerId: string,
  assignmentId: string,
) {
  const access = await getAccess(request, customerId);
  for (const invitation of access.invitations.filter(
    (item) => item.assignmentId === assignmentId,
  )) {
    const response = await request.delete(
      `/api/workspace/crm/portal-invitations/${invitation.id}`,
    );
    expect(response.status()).toBe(HttpResponseCode.Ok);
  }
}

test.describe.serial("portal access", () => {
  test.use({ storageState: portalE2ePaths.managerState });

  test.beforeAll(async () => {
    fixture = JSON.parse(
      await readFile(portalE2ePaths.fixture, "utf8"),
    ) as PortalE2eFixture;
  });

  test("invites through the CRM, redeems once, updates roles and revokes access", async ({
    page,
    browser,
  }) => {
    const manager = page.request;
    const access = await getAccess(manager, fixture.customerA);
    expect(
      access.memberships.some(
        (item) => item.assignmentId === fixture.assignmentA,
      ),
    ).toBe(false);
    const contact = access.contacts.find(
      (item) => item.assignmentId === fixture.assignmentA,
    );
    expect(contact).toBeTruthy();

    const contactContext = await browser.newContext({
      storageState: portalE2ePaths.contactAState,
      baseURL,
    });
    try {
      expect(
        (await page.goto(`/de/crm?cockpit=${fixture.customerA}`))?.status(),
      ).toBe(HttpResponseCode.Ok);
      await page.getByRole("button", { name: "Kontakt einladen" }).click();
      await page.getByRole("button", { name: "Kontakt", exact: true }).click();
      await page
        .getByRole("option", { name: contact!.displayName, exact: true })
        .click();
      if (!access.previewConfirmedAt) {
        await page
          .getByRole("button", { name: "Einladung vorbereiten" })
          .click();
        await expect(page.getByText(/Preise, Budgets/)).toBeVisible();
        await page
          .getByRole("button", { name: "Vorschau bestätigen und einladen" })
          .click();
      } else {
        await page
          .getByRole("button", { name: "Einmal-Link erstellen" })
          .click();
      }
      const inviteUrl = await page.locator("output").innerText();
      const token = tokenFrom(inviteUrl);
      const visitorContext = await browser.newContext({
        baseURL,
        storageState: emptyStorageState,
      });
      try {
        const visitorPage = await visitorContext.newPage();
        expect((await visitorPage.goto(inviteUrl))?.status()).toBe(
          HttpResponseCode.Ok,
        );
        await expect(
          visitorPage.getByRole("link", { name: "Konto erstellen" }),
        ).toBeVisible();
        await expect(
          visitorPage.getByRole("link", { name: "Anmelden" }),
        ).toBeVisible();
      } finally {
        await visitorContext.close();
      }
      const contactPage = await contactContext.newPage();
      expect((await contactPage.goto(inviteUrl))?.status()).toBe(
        HttpResponseCode.Ok,
      );
      await contactPage
        .getByRole("button", { name: "Zugang aktivieren" })
        .click();
      await expect(contactPage).toHaveURL(
        new RegExp(`/de/portal/${fixture.customerA}$`),
      );

      const secondUse = await contactContext.request.post(
        "/api/portal/invitations/redeem",
        { data: { token } },
      );
      expect(secondUse.status()).toBe(HttpResponseCode.NotFound);
      expect(((await secondUse.json()) as { code: string }).code).toBe(
        "redeemed",
      );

      const accessAfter = await getAccess(manager, fixture.customerA);
      const membership = accessAfter.memberships.find(
        (item) => item.assignmentId === fixture.assignmentA,
      );
      expect(membership).toBeTruthy();
      const roleId = accessAfter.roles.find(
        (role) => role.systemKey === "portal_standard",
      )?.id;
      const rolesUpdate = await manager.put(
        `/api/workspace/crm/portal-memberships/${membership!.id}/roles`,
        {
          data: { version: membership!.version, roleIds: [roleId] },
        },
      );
      expect(rolesUpdate.status()).toBe(HttpResponseCode.Ok);
      expect(
        (await contactPage.goto(`/de/portal/${fixture.customerB}`))?.status(),
      ).toBe(HttpResponseCode.NotFound);

      await revokeActiveAccess(manager, fixture.customerA, fixture.assignmentA);
      expect(
        (await contactPage.goto(`/de/portal/${fixture.customerA}`))?.status(),
      ).toBe(HttpResponseCode.NotFound);
    } finally {
      await revokeActiveAccess(manager, fixture.customerA, fixture.assignmentA);
      await revokeOpenInvitations(
        manager,
        fixture.customerA,
        fixture.assignmentA,
      );
      await contactContext.close();
    }
  });

  test("keeps a second company's membership after the first is revoked", async ({
    page,
    browser,
  }) => {
    const manager = page.request;
    const contactContext = await browser.newContext({
      storageState: portalE2ePaths.contactAState,
      baseURL,
    });
    try {
      const invitationA = await invite(
        manager,
        fixture.customerA,
        fixture.assignmentA,
      );
      const invitationB = await invite(
        manager,
        fixture.customerB,
        fixture.assignmentB,
      );
      for (const invitation of [invitationA, invitationB]) {
        const response = await contactContext.request.post(
          "/api/portal/invitations/redeem",
          {
            data: { token: tokenFrom(invitation.url) },
          },
        );
        expect(response.status()).toBe(HttpResponseCode.Ok);
      }
      const contactPage = await contactContext.newPage();
      expect((await contactPage.goto("/de/portal"))?.status()).toBe(
        HttpResponseCode.Ok,
      );
      await expect(
        contactPage
          .getByRole("list", { name: "Verfügbare Firmen" })
          .getByRole("link"),
      ).toHaveCount(2);
      await revokeActiveAccess(manager, fixture.customerA, fixture.assignmentA);
      expect(
        (await contactPage.goto(`/de/portal/${fixture.customerA}`))?.status(),
      ).toBe(HttpResponseCode.NotFound);
      expect(
        (await contactPage.goto(`/de/portal/${fixture.customerB}`))?.status(),
      ).toBe(HttpResponseCode.Ok);
    } finally {
      await revokeActiveAccess(manager, fixture.customerA, fixture.assignmentA);
      await revokeActiveAccess(manager, fixture.customerB, fixture.assignmentB);
      await revokeOpenInvitations(
        manager,
        fixture.customerA,
        fixture.assignmentA,
      );
      await revokeOpenInvitations(
        manager,
        fixture.customerB,
        fixture.assignmentB,
      );
      await contactContext.close();
    }
  });

  test("allows exactly one concurrent redemption and rejects a revoked link", async ({
    page,
    browser,
  }) => {
    const manager = page.request;
    const contactContext = await browser.newContext({
      storageState: portalE2ePaths.contactBState,
      baseURL,
    });
    try {
      const first = await invite(
        manager,
        fixture.customerA,
        fixture.assignmentOther,
      );
      const token = tokenFrom(first.url);
      const responses = await Promise.all([
        contactContext.request.post("/api/portal/invitations/redeem", {
          data: { token },
        }),
        contactContext.request.post("/api/portal/invitations/redeem", {
          data: { token },
        }),
      ]);
      expect(responses.map((response) => response.status()).sort()).toEqual([
        HttpResponseCode.Ok,
        HttpResponseCode.NotFound,
      ]);
      await revokeActiveAccess(
        manager,
        fixture.customerA,
        fixture.assignmentOther,
      );

      const second = await invite(
        manager,
        fixture.customerA,
        fixture.assignmentOther,
      );
      const access = await getAccess(manager, fixture.customerA);
      const invitation = access.invitations.find(
        (item) => item.assignmentId === fixture.assignmentOther,
      );
      expect(invitation).toBeTruthy();
      expect(
        (
          await manager.delete(
            `/api/workspace/crm/portal-invitations/${invitation!.id}`,
          )
        ).status(),
      ).toBe(HttpResponseCode.Ok);
      const revoked = await contactContext.request.post(
        "/api/portal/invitations/redeem",
        {
          data: { token: tokenFrom(second.url) },
        },
      );
      expect(revoked.status()).toBe(HttpResponseCode.NotFound);
      expect(((await revoked.json()) as { code: string }).code).toBe("invalid");
    } finally {
      await revokeActiveAccess(
        manager,
        fixture.customerA,
        fixture.assignmentOther,
      );
      await revokeOpenInvitations(
        manager,
        fixture.customerA,
        fixture.assignmentOther,
      );
      await contactContext.close();
    }
  });

  test("explains an expired link before sign-in", async ({ browser }) => {
    const context = await browser.newContext({
      baseURL,
      storageState: emptyStorageState,
    });
    try {
      const page = await context.newPage();
      await page.goto(`/de/portal/invite/${fixture.expiredToken}`);
      await expect(
        page.getByRole("alert").filter({ hasText: "abgelaufen" }),
      ).toBeVisible();
      await expect(page.getByRole("link", { name: "Anmelden" })).toHaveCount(0);
    } finally {
      await context.close();
    }
  });

  test("returns specific API errors for invalid assignments, roles and missing sessions", async ({
    page,
    browser,
  }) => {
    const manager = page.request;
    const access = await getAccess(manager, fixture.customerA);
    const roleId = access.roles.find(
      (role) => role.systemKey === "portal_standard" && role.active,
    )?.id;
    expect(roleId).toBeTruthy();
    const endpoint = `/api/workspace/crm/customers/${fixture.customerA}/portal-invitations?locale=de`;
    const missingAssignment = await manager.post(endpoint, {
      data: {
        assignmentId: "00000000-0000-4000-8000-000000000000",
        roleIds: [roleId],
        emailNotificationsEnabled: true,
      },
    });
    expect(missingAssignment.status()).toBe(HttpResponseCode.NotFound);
    expect(((await missingAssignment.json()) as { code: string }).code).toBe(
      "assignment_not_found",
    );

    const invalidRole = await manager.post(endpoint, {
      data: {
        assignmentId: fixture.assignmentA,
        roleIds: ["00000000-0000-4000-8000-000000000000"],
        emailNotificationsEnabled: true,
      },
    });
    expect(invalidRole.status()).toBe(HttpResponseCode.BadRequest);
    expect(((await invalidRole.json()) as { code: string }).code).toBe(
      "invalid_portal_role",
    );

    const visitor = await browser.newContext({
      baseURL,
      storageState: emptyStorageState,
    });
    try {
      const unauthenticated = await visitor.request.post(endpoint, {
        data: {
          assignmentId: fixture.assignmentA,
          roleIds: [roleId],
          emailNotificationsEnabled: true,
        },
      });
      expect(unauthenticated.status()).toBe(HttpResponseCode.Unauthorized);
      expect(((await unauthenticated.json()) as { error: string }).error).toBe(
        "UNAUTHORIZED",
      );
    } finally {
      await visitor.close();
    }
  });
});
