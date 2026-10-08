// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CredentialApiErrorCode } from "@invessiv/common/constants/credentials/credential-api-error-code";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { credentialFixture } from "@/common/patterns/testing/credential-fixture";
import { getCrmCredentialsDictionary } from "@/i18n/dictionaries/workspace/crm";
import { CredentialPortalVisibilityDialog } from "./credential-portal-visibility-dialog";

const mocks = vi.hoisted(() => ({
  setPortalVisibility: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock("@/client/crm/credentials-api-service", () => ({
  credentialsApiService: { setPortalVisibility: mocks.setPortalVisibility },
}));
const content = getCrmCredentialsDictionary("de").portalVisibility;
const dictionary = getCrmCredentialsDictionary("de");
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

function renderDialog(
  credential = credentialFixture(),
  handlers = { changed: vi.fn(), close: vi.fn(), conflict: vi.fn() },
) {
  render(
    <CredentialPortalVisibilityDialog
      content={dictionary}
      credential={credential}
      onChangedAction={handlers.changed}
      onCloseAction={handlers.close}
      onConflictAction={handlers.conflict}
    />,
  );
  return handlers;
}

describe("CredentialPortalVisibilityDialog", () => {
  it("names username, password and note before releasing", async () => {
    const entry = credentialFixture();
    const released = { ...entry, visibleToCustomer: true, version: 2 };
    mocks.setPortalVisibility.mockResolvedValue({ ok: true, value: released });
    const handlers = renderDialog(entry);

    expect(screen.getByText(content.release.hint)).toHaveTextContent(
      /Benutzername, Passwort und Notiz/,
    );
    fireEvent.click(
      screen.getByRole("button", { name: content.release.confirm }),
    );

    await waitFor(() => expect(handlers.close).toHaveBeenCalledOnce());
    expect(mocks.setPortalVisibility).toHaveBeenCalledWith(entry.id, {
      version: 1,
      visibleToCustomer: true,
    });
    expect(handlers.changed).toHaveBeenCalledWith(released);
  });

  it("withdraws a released entry", async () => {
    const entry = credentialFixture({ visibleToCustomer: true, version: 3 });
    mocks.setPortalVisibility.mockResolvedValue({
      ok: true,
      value: { ...entry, visibleToCustomer: false, version: 4 },
    });
    const handlers = renderDialog(entry);

    fireEvent.click(
      screen.getByRole("button", { name: content.withdraw.confirm }),
    );

    await waitFor(() => expect(handlers.close).toHaveBeenCalledOnce());
    expect(mocks.setPortalVisibility).toHaveBeenCalledWith(entry.id, {
      version: 3,
      visibleToCustomer: false,
    });
  });

  it("keeps the direction and retries with the fresh version after a conflict", async () => {
    const entry = credentialFixture();
    const fresh = { ...entry, title: "Changed entry", version: 2 };
    mocks.setPortalVisibility
      .mockResolvedValueOnce({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        current: fresh,
      })
      .mockResolvedValueOnce({
        ok: true,
        value: { ...fresh, visibleToCustomer: true, version: 3 },
      });
    const handlers = renderDialog(entry);

    fireEvent.click(
      screen.getByRole("button", { name: content.release.confirm }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      content.conflict,
    );
    expect(handlers.conflict).toHaveBeenCalledWith(fresh);
    expect(handlers.close).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole("button", { name: content.release.confirm }),
    );
    await waitFor(() => expect(handlers.close).toHaveBeenCalledOnce());
    expect(mocks.setPortalVisibility).toHaveBeenLastCalledWith(entry.id, {
      version: 2,
      visibleToCustomer: true,
    });
  });

  it.each([
    CredentialApiErrorCode.ProjectHidden,
    CredentialApiErrorCode.CustomerOwned,
  ])("stays open and explains %s", async (code) => {
    mocks.setPortalVisibility.mockResolvedValue({ ok: false, code });
    const handlers = renderDialog();

    fireEvent.click(
      screen.getByRole("button", { name: content.release.confirm }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      dictionary.errors[code],
    );
    expect(handlers.close).not.toHaveBeenCalled();
    expect(handlers.changed).not.toHaveBeenCalled();
  });
});
