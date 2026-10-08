// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CredentialApiErrorCode } from "@invessiv/common/constants/credentials/credential-api-error-code";
import { CredentialRevealIntent } from "@invessiv/common/constants/credentials/credential-reveal-intents";
import { CredentialSecretField } from "@invessiv/common/constants/credentials/credential-secret-fields";
import { CredentialSide } from "@invessiv/common/constants/credentials/credential-sides";
import { CredentialType } from "@invessiv/common/constants/credentials/credential-types";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { CredentialDto } from "@invessiv/common/contracts/credentials/credential.dto";
import { getCrmCredentialsDictionary } from "@/i18n/dictionaries/workspace/crm";
import { CredentialFormDialog } from "./credential-form-dialog";

const api = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  reveal: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: api.refresh }),
}));
vi.mock("@/client/crm/credentials-api-service", () => ({
  credentialsApiService: {
    create: api.create,
    update: api.update,
    reveal: api.reveal,
  },
}));

const content = getCrmCredentialsDictionary("en");
const form = content.form;
const CUSTOMER_ID = "customer-1";
const PROJECT_ID = "project-1";

function credential(overrides: Partial<CredentialDto> = {}): CredentialDto {
  return {
    id: "credential-1",
    customerId: CUSTOMER_ID,
    projectId: null,
    title: "Hosting",
    credentialType: CredentialType.Hosting,
    url: "https://example.com",
    username: "deploy",
    hasNote: true,
    visibleToCustomer: false,
    createdBySide: CredentialSide.Internal,
    secretChangedAt: "2026-10-01T08:00:00.000Z",
    lastRevealedAt: null,
    updatedAt: "2026-10-01T08:00:00.000Z",
    version: 3,
    capabilities: { canWrite: true, canReveal: true },
    ...overrides,
  };
}

function renderDialog(entry?: CredentialDto) {
  const onCloseAction = vi.fn();
  const onSavedAction = vi.fn();
  render(
    <CredentialFormDialog
      content={content}
      credential={entry}
      customerId={CUSTOMER_ID}
      defaultTarget={null}
      onCloseAction={onCloseAction}
      onSavedAction={onSavedAction}
      projects={[{ id: PROJECT_ID, title: "Relaunch" }]}
      targets={[null, PROJECT_ID]}
    />,
  );
  return { onCloseAction, onSavedAction };
}

const field = (label: string) =>
  screen.getByLabelText(new RegExp(`^${label}`)) as HTMLInputElement;
const type = (label: string, value: string) =>
  fireEvent.change(field(label), { target: { value } });
const submit = (label: string) =>
  fireEvent.click(screen.getByRole("button", { name: label }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.useRealTimers();
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: "visible",
  });
});

describe("revealed note edits", () => {
  it.each([true, false])(
    "keeps an edited reveal on conflict when the fresh entry hasNote is %s",
    async (hasNote) => {
      const fresh = credential({ version: 5, hasNote });
      api.reveal.mockResolvedValue({ ok: true, value: "stored note" });
      api.update
        .mockResolvedValueOnce({
          ok: false,
          code: ConcurrencyErrorCode.VersionConflict,
          current: fresh,
        })
        .mockResolvedValueOnce({ ok: true, value: { ...fresh, version: 6 } });
      renderDialog(credential());
      await act(async () => submit(form.note.reveal));
      type(form.fields.note, "my note edit");
      await act(async () => submit(form.submitEdit));
      expect(field(form.fields.note)).toHaveValue("my note edit");
      await act(async () => submit(form.submitEdit));
      expect(api.update).toHaveBeenLastCalledWith(fresh.id, {
        version: 5,
        note: "my note edit",
      });
    },
  );

  it.each(["before conflict", "after conflict"])(
    "expires the edited reveal at its original deadline %s",
    async (timing) => {
      const fresh = credential({ version: 5 });
      let resolveConflict!: (result: unknown) => void;
      api.reveal.mockResolvedValue({ ok: true, value: "stored note" });
      api.update.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveConflict = resolve;
          }),
      );
      renderDialog(credential());
      vi.useFakeTimers();
      await act(async () => submit(form.note.reveal));
      type(form.fields.note, "my note edit");
      act(() => vi.advanceTimersByTime(20_000));
      await act(async () => submit(form.submitEdit));
      if (timing === "before conflict")
        act(() => vi.advanceTimersByTime(10_000));
      await act(async () =>
        resolveConflict({
          ok: false,
          code: ConcurrencyErrorCode.VersionConflict,
          current: fresh,
        }),
      );
      if (timing === "after conflict") {
        expect(field(form.fields.note)).toHaveValue("my note edit");
        act(() => vi.advanceTimersByTime(10_000));
      }
      expect(screen.queryByDisplayValue("my note edit")).toBeNull();
      await act(async () => submit(form.submitEdit));
      expect(api.update).toHaveBeenCalledOnce();
    },
  );

  it.each(["timeout", "background"])(
    "keeps the stored note when an edited reveal expires through %s",
    async (reason) => {
      api.reveal.mockResolvedValue({ ok: true, value: "stored note" });
      const { onCloseAction } = renderDialog(credential());
      vi.useFakeTimers();
      await act(async () => submit(form.note.reveal));
      type(form.fields.note, "stored note edited");
      expect(field(form.fields.note)).toHaveValue("stored note edited");
      act(() => {
        if (reason === "timeout") vi.advanceTimersByTime(30_000);
        else {
          Object.defineProperty(document, "visibilityState", {
            configurable: true,
            value: "hidden",
          });
          document.dispatchEvent(new Event("visibilitychange"));
        }
      });
      expect(screen.queryByDisplayValue("stored note edited")).toBeNull();
      submit(form.submitEdit);
      expect(api.update).not.toHaveBeenCalled();
      expect(onCloseAction).toHaveBeenCalledOnce();
    },
  );

  it("submits a revealed note edit while it is still visible", async () => {
    const entry = credential();
    api.reveal.mockResolvedValue({ ok: true, value: "stored note" });
    api.update.mockResolvedValue({ ok: true, value: { ...entry, version: 4 } });
    renderDialog(entry);
    await act(async () => submit(form.note.reveal));
    type(form.fields.note, "stored note edited");
    await act(async () => submit(form.submitEdit));
    expect(api.update).toHaveBeenCalledWith(entry.id, {
      version: entry.version,
      note: "stored note edited",
    });
  });
});

describe("CredentialFormDialog (create)", () => {
  it("keeps the browser from storing or filling the credentials", () => {
    renderDialog();

    expect(field(form.fields.secret)).toHaveAttribute("type", "password");
    expect(field(form.fields.secret)).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
    expect(field(form.fields.username)).toHaveAttribute("autocomplete", "off");
    expect(field(form.fields.title).closest("form")).toHaveAttribute(
      "autocomplete",
      "off",
    );
  });

  it("toggles the typed secret between hidden and visible", () => {
    renderDialog();
    type(form.fields.secret, "typed");

    fireEvent.click(screen.getByRole("button", { name: form.showSecret }));
    expect(field(form.fields.secret)).toHaveAttribute("type", "text");
    expect(field(form.fields.secret)).toHaveValue("typed");

    fireEvent.click(screen.getByRole("button", { name: form.hideSecret }));
    expect(field(form.fields.secret)).toHaveAttribute("type", "password");
  });

  it("names missing required fields and focuses the first one", async () => {
    renderDialog();

    submit(form.submitCreate);

    expect(
      await screen.findByText(form.validation.titleRequired),
    ).toBeInTheDocument();
    expect(
      screen.getByText(form.validation.secretRequired),
    ).toBeInTheDocument();
    await waitFor(() => expect(field(form.fields.title)).toHaveFocus());
    expect(api.create).not.toHaveBeenCalled();
  });

  it("rejects a title above the limit before sending", async () => {
    renderDialog();
    type(form.fields.title, "t".repeat(121));
    type(form.fields.secret, "secret");

    submit(form.submitCreate);

    expect(
      await screen.findByText(form.validation.tooLong.replace("{max}", "120")),
    ).toBeInTheDocument();
    expect(api.create).not.toHaveBeenCalled();
  });

  it("sends the new entry and hands it to the section", async () => {
    const created = credential({ hasNote: false, version: 1 });
    api.create.mockResolvedValue({ ok: true, value: created });
    const { onCloseAction, onSavedAction } = renderDialog();
    type(form.fields.title, "  Hosting ");
    type(form.fields.username, "deploy");
    type(form.fields.secret, " pass word ");
    type(form.fields.note, " customer number 42 ");

    submit(form.submitCreate);

    await waitFor(() => expect(onCloseAction).toHaveBeenCalledOnce());
    expect(api.create).toHaveBeenCalledExactlyOnceWith(CUSTOMER_ID, {
      projectId: null,
      title: "Hosting",
      credentialType: CredentialType.Other,
      url: null,
      username: "deploy",
      secret: " pass word ",
      note: "customer number 42",
    });
    expect(onSavedAction).toHaveBeenCalledExactlyOnceWith(created, true);
  });

  it("keeps a new entry internal unless the release is ticked", async () => {
    api.create.mockResolvedValue({
      ok: true,
      value: credential({ visibleToCustomer: true, version: 1 }),
    });
    renderDialog();
    const release = screen.getByRole("checkbox", { name: form.release.label });

    expect(release).not.toBeChecked();
    expect(release).toHaveAccessibleDescription(
      /Benutzername|username, password and note/,
    );
    fireEvent.click(release);
    type(form.fields.title, "Hosting");
    type(form.fields.secret, "secret");
    submit(form.submitCreate);

    await waitFor(() => expect(api.create).toHaveBeenCalledOnce());
    expect(api.create).toHaveBeenCalledWith(
      CUSTOMER_ID,
      expect.objectContaining({ title: "Hosting", visibleToCustomer: true }),
    );
  });

  it("explains a release refused for a project the portal does not show", async () => {
    api.create.mockResolvedValue({
      ok: false,
      code: CredentialApiErrorCode.ProjectHidden,
    });
    const { onCloseAction } = renderDialog();
    fireEvent.click(screen.getByRole("checkbox", { name: form.release.label }));
    type(form.fields.title, "Hosting");
    type(form.fields.secret, "secret");
    submit(form.submitCreate);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      content.errors.project_hidden,
    );
    expect(onCloseAction).not.toHaveBeenCalled();
  });

  it("says when encryption is not set up and keeps the input", async () => {
    api.create.mockResolvedValue({
      ok: false,
      code: CredentialApiErrorCode.NotConfigured,
    });
    const { onCloseAction } = renderDialog();
    type(form.fields.title, "Hosting");
    type(form.fields.secret, "secret");

    submit(form.submitCreate);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      content.errors.not_configured,
    );
    expect(field(form.fields.secret)).toHaveValue("secret");
    expect(onCloseAction).not.toHaveBeenCalled();
  });
});

describe("CredentialFormDialog (edit)", () => {
  it("never loads the secret and explains the empty field", () => {
    renderDialog(credential());

    expect(field(form.fields.secret)).toHaveValue("");
    expect(screen.getByText(form.hints.secretKeep)).toBeInTheDocument();
    expect(screen.getByText(form.note.exists)).toBeInTheDocument();
    expect(api.reveal).not.toHaveBeenCalled();
  });

  it("shows the stored release and changes it together with the edit", async () => {
    const entry = credential({ visibleToCustomer: false });
    api.update.mockResolvedValue({
      ok: true,
      value: { ...entry, visibleToCustomer: true, version: 4 },
    });
    renderDialog(entry);
    const release = screen.getByRole("checkbox", { name: form.release.label });

    expect(release).not.toBeChecked();
    fireEvent.click(release);
    submit(form.submitEdit);

    await waitFor(() => expect(api.update).toHaveBeenCalledOnce());
    expect(api.update).toHaveBeenCalledWith(entry.id, {
      version: 3,
      visibleToCustomer: true,
    });
    cleanup();

    renderDialog(credential({ visibleToCustomer: true }));
    expect(
      screen.getByRole("checkbox", { name: form.release.label }),
    ).toBeChecked();
  });

  it("offers no release choice for an entry the customer created", () => {
    renderDialog(
      credential({
        createdBySide: CredentialSide.Customer,
        visibleToCustomer: true,
      }),
    );

    expect(
      screen.queryByRole("checkbox", { name: form.release.label }),
    ).toBeNull();
  });

  it("closes without a request when nothing changed", async () => {
    const { onCloseAction } = renderDialog(credential());

    submit(form.submitEdit);

    await waitFor(() => expect(onCloseAction).toHaveBeenCalledOnce());
    expect(api.update).not.toHaveBeenCalled();
  });

  it("sends only the changed fields and leaves secret and note alone", async () => {
    const saved = credential({ title: "Renamed", version: 4 });
    api.update.mockResolvedValue({ ok: true, value: saved });
    const { onSavedAction } = renderDialog(credential());
    type(form.fields.title, "Renamed");

    submit(form.submitEdit);

    await waitFor(() =>
      expect(onSavedAction).toHaveBeenCalledExactlyOnceWith(saved, false),
    );
    expect(api.update).toHaveBeenCalledExactlyOnceWith("credential-1", {
      version: 3,
      title: "Renamed",
    });
  });

  it("removes the note only on request and lets the user take it back", async () => {
    api.update.mockResolvedValue({ ok: true, value: credential() });
    renderDialog(credential());

    fireEvent.click(screen.getByRole("button", { name: form.note.remove }));
    expect(screen.getByText(form.note.removed)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: form.note.keep }));
    expect(screen.getByText(form.note.exists)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: form.note.remove }));
    submit(form.submitEdit);

    await waitFor(() =>
      expect(api.update).toHaveBeenCalledExactlyOnceWith("credential-1", {
        version: 3,
        note: null,
      }),
    );
  });

  it("replaces the note without revealing the old one", async () => {
    api.update.mockResolvedValue({ ok: true, value: credential() });
    renderDialog(credential());

    fireEvent.click(screen.getByRole("button", { name: form.note.replace }));
    expect(field(form.fields.note)).toHaveValue("");
    type(form.fields.note, "new note");
    submit(form.submitEdit);

    await waitFor(() =>
      expect(api.update).toHaveBeenCalledExactlyOnceWith("credential-1", {
        version: 3,
        note: "new note",
      }),
    );
    expect(api.reveal).not.toHaveBeenCalled();
  });

  it("reveals the note for editing as an audited show", async () => {
    api.reveal.mockResolvedValue({ ok: true, value: "stored note" });
    renderDialog(credential());

    fireEvent.click(screen.getByRole("button", { name: form.note.reveal }));

    await waitFor(() =>
      expect(field(form.fields.note)).toHaveValue("stored note"),
    );
    expect(api.reveal).toHaveBeenCalledExactlyOnceWith(
      "credential-1",
      CredentialSecretField.Note,
      CredentialRevealIntent.Show,
    );
  });

  it("offers no reveal without the right and reports a refused one", async () => {
    const first = render(<></>);
    first.unmount();
    renderDialog(
      credential({ capabilities: { canWrite: true, canReveal: false } }),
    );
    expect(screen.queryByRole("button", { name: form.note.reveal })).toBeNull();
    expect(
      screen.getByRole("button", { name: form.note.replace }),
    ).toBeInTheDocument();
    cleanup();

    api.reveal.mockResolvedValue({
      ok: false,
      code: CredentialApiErrorCode.RateLimited,
    });
    renderDialog(credential());
    fireEvent.click(screen.getByRole("button", { name: form.note.reveal }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      content.errors.rate_limited,
    );
    expect(screen.getByText(form.note.exists)).toBeInTheDocument();
  });

  it("keeps the input on a version conflict and retries against the new version", async () => {
    const fresh = credential({ version: 5, username: "changed-by-someone" });
    api.update
      .mockResolvedValueOnce({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        current: fresh,
      })
      .mockResolvedValueOnce({ ok: true, value: credential({ version: 6 }) });
    const { onCloseAction } = renderDialog(credential());
    type(form.fields.title, "My title");
    type(form.fields.secret, "rotated");

    submit(form.submitEdit);

    expect(await screen.findByRole("alert")).toHaveTextContent(form.conflict);
    expect(field(form.fields.title)).toHaveValue("My title");
    expect(field(form.fields.secret)).toHaveValue("rotated");
    expect(onCloseAction).not.toHaveBeenCalled();

    submit(form.submitEdit);

    await waitFor(() => expect(onCloseAction).toHaveBeenCalledOnce());
    expect(api.update).toHaveBeenLastCalledWith(
      "credential-1",
      expect.objectContaining({
        version: 5,
        title: "My title",
        secret: "rotated",
      }),
    );
  });
});
