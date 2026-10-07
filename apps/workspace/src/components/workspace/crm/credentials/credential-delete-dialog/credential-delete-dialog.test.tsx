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
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { CredentialApiErrorCode } from "@invessiv/common/constants/credentials/credential-api-error-code";
import { credentialFixture } from "@/common/patterns/testing/credential-fixture";
import { getCrmCredentialsDictionary } from "@/i18n/dictionaries/workspace/crm";
import { CredentialDeleteDialog } from "./credential-delete-dialog";

const mocks = vi.hoisted(() => ({ remove: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock("@/client/crm/credentials-api-service", () => ({
  credentialsApiService: { remove: mocks.remove },
}));
const content = getCrmCredentialsDictionary("de");
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe("CredentialDeleteDialog", () => {
  it("adopts the conflict version before retrying and closes only on success", async () => {
    const entry = credentialFixture();
    const fresh = { ...entry, title: "Changed entry", version: 2 };
    const changed = vi.fn(),
      deleted = vi.fn(),
      close = vi.fn();
    mocks.remove
      .mockResolvedValueOnce({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        current: fresh,
      })
      .mockResolvedValueOnce({ ok: true });
    render(
      <CredentialDeleteDialog
        content={content}
        credential={entry}
        onChangedAction={changed}
        onDeletedAction={deleted}
        onCloseAction={close}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: content.delete.confirm }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      content.delete.conflict,
    );
    expect(changed).toHaveBeenCalledWith(fresh);
    expect(close).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: content.delete.confirm }),
    );
    await waitFor(() => expect(close).toHaveBeenCalledOnce());
    expect(mocks.remove).toHaveBeenLastCalledWith(entry.id, 2);
    expect(deleted).toHaveBeenCalledWith(fresh);
  });

  it("keeps a failed delete open and reports the API error", async () => {
    const close = vi.fn();
    mocks.remove.mockResolvedValue({
      ok: false,
      code: CredentialApiErrorCode.NotFound,
    });
    render(
      <CredentialDeleteDialog
        content={content}
        credential={credentialFixture()}
        onChangedAction={vi.fn()}
        onDeletedAction={vi.fn()}
        onCloseAction={close}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: content.delete.confirm }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      content.errors.not_found,
    );
    expect(close).not.toHaveBeenCalled();
  });
});
