import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { CredentialApiErrorCode } from "@invessiv/common/constants/credentials/credential-api-error-code";
import { CredentialRevealIntent } from "@invessiv/common/constants/credentials/credential-reveal-intents";
import { CredentialSecretField } from "@invessiv/common/constants/credentials/credential-secret-fields";
import { CredentialType } from "@invessiv/common/constants/credentials/credential-types";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { CredentialDto } from "@invessiv/common/contracts/credentials/credential.dto";
import type { PortalAccessDto } from "@invessiv/common/contracts/crm/portal-access.dto";
import type { PortalCredentialListDto } from "@invessiv/common/contracts/portal/portal-credential-list.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import {
  crmCustomerCredentialsEndpoint,
  crmCredentialPortalVisibilityEndpoint,
} from "@/common/patterns/crm/crm-api-endpoints";
import { portalAccessApiEndpoints } from "@/common/patterns/crm/portal-access-api-endpoints";
import {
  portalCredentialEndpoint,
  portalCredentialRevealEndpoint,
  portalCredentialsEndpoint,
} from "@/common/patterns/portal/portal-api-endpoints";
import { portalPathFor } from "@/lib/auth/routes";
import content from "@/i18n/dictionaries/portal/credentials/de.json";
import english from "@/i18n/dictionaries/portal/credentials/en.json";
import {
  type PortalE2eFixture,
  portalE2ePaths,
} from "./support/portal-e2e-fixture";

let fixture: PortalE2eFixture;

test.beforeAll(async () => {
  fixture = JSON.parse(
    await readFile(portalE2ePaths.fixture, "utf8"),
  ) as PortalE2eFixture;
});

test("protects, releases, reveals, edits and revokes credentials with real Clerk sessions", async ({
  browser,
}, testInfo) => {
  const manager = await browser.newContext({
    storageState: portalE2ePaths.managerState,
  });
  const contact = await browser.newContext({
    storageState: portalE2ePaths.filesContactState,
    permissions: ["clipboard-read", "clipboard-write"],
  });
  const standard = await browser.newContext({
    storageState: portalE2ePaths.feedbackContactState,
  });
  const anonymous = await browser.newContext({
    storageState: { cookies: [], origins: [] },
  });
  const customerId = fixture.credentialsCustomer;
  const endpoint = portalCredentialsEndpoint(customerId);
  const secret = "Synthetic E2E secret";
  const note = "Synthetic E2E note";
  const title = "E2E internal hosting";
  const membershipRoles = portalAccessApiEndpoints.membershipRoles(
    fixture.credentialsMembership,
  );

  try {
    expect((await anonymous.request.get(endpoint)).status()).toBe(401);
    expect((await standard.request.get(endpoint)).status()).toBe(404);
    // The same identity's grant on this customer cannot authorize another customer.
    expect(
      (
        await contact.request.get(portalCredentialsEndpoint(fixture.customerA))
      ).status(),
    ).toBe(404);

    const input = {
      projectId: fixture.credentialsProject,
      title,
      credentialType: CredentialType.Hosting,
      url: null,
      username: "e2e-login",
      secret,
      note,
    };
    const created = await manager.request.post(
      crmCustomerCredentialsEndpoint(customerId),
      { data: input },
    );
    expect(created.status()).toBe(201);
    const credential = (await created.json()) as CredentialDto;
    const revealEndpoint = portalCredentialRevealEndpoint(
      customerId,
      credential.id,
    );
    const reveal = {
      field: CredentialSecretField.Secret,
      intent: CredentialRevealIntent.Show,
    };
    const hiddenList = await contact.request.get(endpoint);
    expect(hiddenList.status()).toBe(200);
    expect(
      ((await hiddenList.json()) as PortalCredentialListDto).credentials,
    ).toHaveLength(0);
    expect(
      (await contact.request.post(revealEndpoint, { data: reveal })).status(),
    ).toBe(404);

    const hiddenRelease = await manager.request.post(
      crmCustomerCredentialsEndpoint(customerId),
      {
        data: {
          ...input,
          projectId: fixture.credentialsHiddenProject,
          visibleToCustomer: true,
        },
      },
    );
    expect(hiddenRelease.status()).toBe(409);
    expect((await hiddenRelease.json()).code).toBe(
      CredentialApiErrorCode.ProjectHidden,
    );

    const released = await manager.request.patch(
      crmCredentialPortalVisibilityEndpoint(credential.id),
      {
        data: { version: credential.version, visibleToCustomer: true },
      },
    );
    expect(released.status()).toBe(200);
    const releasedCredential = (await released.json()) as CredentialDto;
    const listed = await contact.request.get(endpoint);
    expect(listed.status()).toBe(200);
    const metadata = (await listed.json()) as PortalCredentialListDto;
    expect(listed.headers()["cache-control"]).toContain("no-store");
    expect(metadata.credentials.map((entry) => entry.id)).toContain(
      credential.id,
    );
    expect(JSON.stringify(metadata)).not.toContain(secret);
    expect(JSON.stringify(metadata)).not.toContain(note);
    expect(metadata.capabilities).toMatchObject({
      canWrite: true,
      canReveal: true,
    });
    const ownerList = await manager.request.get(endpoint);
    expect(ownerList.status()).toBe(200);
    expect(
      ((await ownerList.json()) as PortalCredentialListDto).capabilities,
    ).toEqual({ canWrite: false, canReveal: false });
    expect(
      (await manager.request.post(revealEndpoint, { data: reveal })).status(),
    ).toBe(404);
    const ownerPage = await manager.newPage();
    for (const [locale, labels] of [
      ["de", content],
      ["en", english],
    ] as const) {
      await ownerPage.goto(
        portalPathFor(locale, customerId) + "?widget=credentials",
      );
      const ownerDialog = ownerPage.getByRole("dialog", {
        name: labels.dialog.title,
        exact: true,
      });
      await expect(
        ownerDialog.getByText(labels.owner.hint, { exact: true }),
      ).toBeVisible();
      await expect(
        ownerDialog.getByRole("button", {
          name: labels.actions.add,
          exact: true,
        }),
      ).toHaveCount(0);
      await expect(
        ownerDialog.getByRole("button", {
          name: formatMessage(labels.secretField.showNamed, {
            name: formatMessage(labels.row.secretNamed, { name: title }),
          }),
          exact: true,
        }),
      ).toHaveCount(0);
      await expect(
        ownerDialog.getByRole("button", {
          name: formatMessage(labels.row.editNamed, { name: title }),
          exact: true,
        }),
      ).toHaveCount(0);
      for (const theme of ["dark", "light"] as const) {
        await ownerPage.evaluate((value) => {
          document.documentElement.dataset.theme = value;
        }, theme);
        for (const width of [360, 1280]) {
          await ownerPage.setViewportSize({ width, height: 900 });
          await expect(
            ownerDialog.getByText(title, { exact: true }),
          ).toBeVisible();
          expect(
            await ownerPage.evaluate(
              () => document.documentElement.scrollWidth > window.innerWidth,
            ),
          ).toBe(false);
          await ownerPage.screenshot({
            path: testInfo.outputPath(
              `credentials-owner-${locale}-${theme}-${width}.png`,
            ),
          });
        }
      }
      await ownerDialog
        .getByRole("button", { name: labels.dialog.close, exact: true })
        .focus();
      await ownerPage.keyboard.press("Escape");
      await expect(ownerDialog).toBeHidden();
    }
    expect(
      (await standard.request.post(revealEndpoint, { data: reveal })).status(),
    ).toBe(404);
    expect(
      (
        await contact.request.post(
          portalCredentialRevealEndpoint(
            fixture.feedbackCustomer,
            credential.id,
          ),
          { data: reveal },
        )
      ).status(),
    ).toBe(404);

    const page = await contact.newPage();
    await page.goto(portalPathFor("de", customerId) + "?widget=credentials");
    const list = page.getByRole("dialog", {
      name: content.dialog.title,
      exact: true,
    });
    await expect(list.getByText(title, { exact: true })).toBeVisible();
    await expect(list.getByText(secret, { exact: true })).toHaveCount(0);

    await list
      .getByRole("button", { name: `Notiz zu ${title} anzeigen`, exact: true })
      .click();
    await expect(list.getByText(note, { exact: true })).toBeVisible();
    await list
      .getByRole("button", { name: `Notiz zu ${title} verbergen`, exact: true })
      .click();
    await expect(list.getByText(note, { exact: true })).toHaveCount(0);
    await list
      .getByRole("button", {
        name: `Passwort von ${title} kopieren`,
        exact: true,
      })
      .click();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe(secret);
    await expect(list.getByText(secret, { exact: true })).toHaveCount(0);
    await list
      .getByRole("button", {
        name: `Passwort von ${title} anzeigen`,
        exact: true,
      })
      .click();
    await expect(list.getByText(secret, { exact: true })).toBeVisible();
    await list
      .getByRole("button", {
        name: `Passwort von ${title} verbergen`,
        exact: true,
      })
      .click();
    await expect(list.getByText(secret, { exact: true })).toHaveCount(0);

    await list
      .getByRole("button", { name: `${title} ändern`, exact: true })
      .click();
    const form = page.getByRole("dialog", {
      name: content.form.titleEdit,
      exact: true,
    });
    const renamed = "E2E edited hosting";
    await form
      .getByRole("textbox", { name: content.form.fields.title })
      .fill(renamed);
    const rotatedSecret = "Synthetic rotated E2E secret";
    await form
      .getByLabel(new RegExp(`^${content.form.fields.secret}`))
      .fill(rotatedSecret);
    await form
      .getByRole("button", { name: content.form.submitEdit, exact: true })
      .click();
    await expect(form).toBeHidden();
    await expect(list.getByText(renamed, { exact: true })).toBeVisible();
    const rotated = await contact.request.post(revealEndpoint, {
      data: reveal,
    });
    expect(rotated.status()).toBe(200);
    expect((await rotated.json()).value).toBe(rotatedSecret);

    const stale = await contact.request.patch(
      portalCredentialEndpoint(customerId, credential.id),
      {
        data: { version: releasedCredential.version, title: "Stale change" },
      },
    );
    expect(stale.status()).toBe(409);
    expect((await stale.json()).code).toBe(
      ConcurrencyErrorCode.VersionConflict,
    );

    // Creation uses the real browser form and returns to the list without stacked dialogs.
    await list
      .getByRole("button", { name: content.actions.add, exact: true })
      .click();
    const createForm = page.getByRole("dialog", {
      name: content.form.titleCreate,
      exact: true,
    });
    await createForm
      .getByRole("textbox", { name: content.form.fields.title })
      .fill("E2E customer credential");
    await createForm
      .getByLabel(new RegExp(`^${content.form.fields.secret}`))
      .fill("Synthetic customer secret");
    await createForm
      .getByRole("button", { name: content.form.submitCreate, exact: true })
      .click();
    await expect(createForm).toBeHidden();
    await expect(
      list.getByText("E2E customer credential", { exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(1);
    const latest = await contact.request.get(endpoint);
    const entries = ((await latest.json()) as PortalCredentialListDto)
      .credentials;
    const own = entries.find(
      (entry) => entry.title === "E2E customer credential",
    )!;
    expect(own.createdByCustomer).toBe(true);
    const refusedWithdrawal = await manager.request.patch(
      crmCredentialPortalVisibilityEndpoint(own.id),
      {
        data: { version: own.version, visibleToCustomer: false },
      },
    );
    expect(refusedWithdrawal.status()).toBe(409);
    expect((await refusedWithdrawal.json()).code).toBe(
      CredentialApiErrorCode.CustomerOwned,
    );

    const fresh = entries.find((entry) => entry.id === credential.id)!;
    const withdrawn = await manager.request.patch(
      crmCredentialPortalVisibilityEndpoint(credential.id),
      {
        data: { version: fresh.version, visibleToCustomer: false },
      },
    );
    expect(withdrawn.status()).toBe(200);
    expect(
      (await contact.request.post(revealEndpoint, { data: reveal })).status(),
    ).toBe(404);
    expect(
      (
        await contact.request.patch(
          portalCredentialEndpoint(customerId, credential.id),
          { data: { version: fresh.version, title } },
        )
      ).status(),
    ).toBe(404);

    const revoke = await manager.request.put(membershipRoles, {
      data: { version: 1, roleIds: [fixture.standardRole] },
    });
    expect(revoke.status()).toBe(200);
    expect((await contact.request.get(endpoint)).status()).toBe(404);
    expect(
      (
        await contact.request.post(
          portalCredentialRevealEndpoint(customerId, own.id),
          { data: reveal },
        )
      ).status(),
    ).toBe(404);
    await page.reload();
    await expect(
      page.getByRole("dialog", { name: content.dialog.title, exact: true }),
    ).toHaveCount(0);
  } finally {
    // Leave the fixture grant intact even when a browser assertion fails after revocation.
    const access = await manager.request.get(
      portalAccessApiEndpoints.customer(customerId),
    );
    if (access.ok()) {
      const payload = (await access.json()) as { access: PortalAccessDto };
      const current = payload.access.memberships.find(
        (member) => member.id === fixture.credentialsMembership,
      );
      if (current) {
        const restore = await manager.request.put(membershipRoles, {
          data: {
            version: current.version,
            roleIds: [fixture.standardRole, fixture.credentialsRole],
          },
        });
        expect(restore.status()).toBe(200);
      }
    }
    await Promise.all([
      manager.close(),
      contact.close(),
      standard.close(),
      anonymous.close(),
    ]);
  }
});
