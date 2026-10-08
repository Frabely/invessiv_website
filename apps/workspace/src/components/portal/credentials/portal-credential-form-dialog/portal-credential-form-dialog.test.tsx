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
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { PortalCredentialDto } from "@invessiv/common/contracts/portal/portal-credential.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { portalCredentialFixture } from "@/common/patterns/testing/portal-credential-fixture";
import { getPortalCredentialsDictionary } from "@/i18n/dictionaries/portal";
import { PortalCredentialFormDialog } from "./portal-credential-form-dialog";

const api = vi.hoisted(() => ({
  create: vi.fn(),
  update: vi.fn(),
  reveal: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: api.refresh }),
}));
vi.mock("@/client/portal/portal-credentials-api-service", () => ({
  portalCredentialsApiService: {
    create: api.create,
    update: api.update,
    reveal: api.reveal,
  },
}));

const content = getPortalCredentialsDictionary("de");
const form = content.form;
const CUSTOMER_ID = "customer-1";
const PROJECT = { id: "project-1", title: "Relaunch" };

function renderDialog(credential?: PortalCredentialDto, canReveal = true) {
  const onCloseAction = vi.fn();
  const onSavedAction = vi.fn();
  render(
    <PortalCredentialFormDialog
      canReveal={canReveal}
      content={content}
      credential={credential}
      customerId={CUSTOMER_ID}
      onCloseAction={onCloseAction}
      onSavedAction={onSavedAction}
      projects={[PROJECT]}
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
});

describe("PortalCredentialFormDialog (create)", () => {
  it("says who can read the values before anything is typed", () => {
    renderDialog();

    const notice = screen.getByText(form.notice);
    expect(notice).toHaveTextContent(/verschlüsselt/);
    expect(notice).toHaveTextContent(/nur wir/);
    expect(notice).toHaveTextContent(
      /aus deiner Firma, die dazu berechtigt sind/,
    );
  });

  it("keeps the browser from storing or filling the credentials", () => {
    renderDialog();

    // The release is the team's decision; the portal form offers no such choice.
    expect(screen.queryByRole("checkbox")).toBeNull();

    expect(field(form.fields.secret)).toHaveAttribute("type", "password");
    expect(field(form.fields.secret)).toHaveAttribute(
      "autocomplete",
      "new-password",
    );
    expect(field(form.fields.username)).toHaveAttribute("autocomplete", "off");
  });

  it("names missing required fields without sending", async () => {
    renderDialog();
    submit(form.submitCreate);

    expect(
      await screen.findByText(form.validation.titleRequired),
    ).toBeInTheDocument();
    expect(
      screen.getByText(form.validation.secretRequired),
    ).toBeInTheDocument();
    expect(api.create).not.toHaveBeenCalled();
  });

  it("rejects a title above the limit with its length", async () => {
    renderDialog();
    type(form.fields.title, "x".repeat(121));
    type(form.fields.secret, "secret");
    submit(form.submitCreate);

    expect(
      await screen.findByText(
        formatMessage(form.validation.tooLong, { max: 120 }),
      ),
    ).toBeInTheDocument();
    expect(api.create).not.toHaveBeenCalled();
  });

  it("offers general and the visible projects and sends the entry for the company in the URL", async () => {
    api.create.mockResolvedValue({ ok: true, value: null });
    const { onCloseAction, onSavedAction } = renderDialog();

    expect(field(form.fields.project)).toBeInTheDocument();
    type(form.fields.title, " Hosting ");
    type(form.fields.secret, " pass word ");
    submit(form.submitCreate);

    await waitFor(() => expect(onCloseAction).toHaveBeenCalledOnce());
    expect(api.create).toHaveBeenCalledExactlyOnceWith(CUSTOMER_ID, {
      projectId: null,
      title: "Hosting",
      credentialType: "other",
      url: null,
      username: null,
      // Not trimmed: spaces can be part of a password.
      secret: " pass word ",
      note: null,
    });
    expect(onSavedAction).toHaveBeenCalledWith("Hosting", true);
  });

  it.each([
    CredentialApiErrorCode.NotConfigured,
    CredentialApiErrorCode.Validation,
    CredentialApiErrorCode.Internal,
  ] as const)("stays open and explains %s, keeping the input", async (code) => {
    api.create.mockResolvedValue({ ok: false, code });
    const { onCloseAction } = renderDialog();
    type(form.fields.title, "Hosting");
    type(form.fields.secret, "secret");
    submit(form.submitCreate);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      content.errors[code],
    );
    expect(field(form.fields.title)).toHaveValue("Hosting");
    expect(onCloseAction).not.toHaveBeenCalled();
  });

  it("falls back to the general text for a code the portal does not name", async () => {
    api.create.mockResolvedValue({
      ok: false,
      code: CredentialApiErrorCode.ProjectHidden,
    });
    renderDialog();
    type(form.fields.title, "Hosting");
    type(form.fields.secret, "secret");
    submit(form.submitCreate);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      content.errors.internal,
    );
  });
});

describe("PortalCredentialFormDialog (change)", () => {
  it("closes after a confirmation without metadata and announces the submitted title", async () => {
    api.update.mockResolvedValue({ ok: true, value: null });
    const { onCloseAction, onSavedAction } = renderDialog(
      portalCredentialFixture(),
    );
    type(form.fields.title, "New title");
    submit(form.submitEdit);
    await waitFor(() => expect(onCloseAction).toHaveBeenCalledOnce());
    expect(onSavedAction).toHaveBeenCalledWith("New title", false);
  });

  it("keeps an edit and its draft on a metadata-free conflict and retries the latest version", async () => {
    const entry = portalCredentialFixture({ version: 1 });
    api.update
      .mockResolvedValueOnce({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        current: null,
        currentVersion: 2,
      })
      .mockResolvedValueOnce({ ok: true, value: null });
    const { onCloseAction } = renderDialog(entry);
    type(form.fields.title, "My draft");
    submit(form.submitEdit);
    expect(await screen.findByRole("alert")).toHaveTextContent(form.conflict);
    expect(field(form.fields.title)).toHaveValue("My draft");
    expect(
      screen.getByRole("button", { name: form.submitEdit }),
    ).toBeInTheDocument();
    expect(api.create).not.toHaveBeenCalled();
    submit(form.submitEdit);
    await waitFor(() => expect(onCloseAction).toHaveBeenCalledOnce());
    expect(api.update).toHaveBeenLastCalledWith(CUSTOMER_ID, entry.id, {
      version: 2,
      title: "My draft",
    });
  });

  it("offers no project change and never loads the secret", () => {
    renderDialog(portalCredentialFixture({ projectId: PROJECT.id }));

    expect(
      screen.queryByLabelText(new RegExp(`^${form.fields.project}`)),
    ).toBeNull();
    expect(field(form.fields.secret)).toHaveValue("");
    expect(screen.getByText(form.hints.secretKeep)).toBeInTheDocument();
  });

  it("sends only what changed, without a project", async () => {
    const entry = portalCredentialFixture({ version: 4 });
    const saved = { ...entry, version: 5 };
    api.update.mockResolvedValue({ ok: true, value: saved });
    const { onSavedAction } = renderDialog(entry);

    type(form.fields.secret, "rotated");
    submit(form.submitEdit);

    await waitFor(() => expect(onSavedAction).toHaveBeenCalledOnce());
    expect(api.update).toHaveBeenCalledExactlyOnceWith(CUSTOMER_ID, entry.id, {
      version: 4,
      secret: "rotated",
    });
    expect(onSavedAction).toHaveBeenCalledWith(entry.title, false);
  });

  it("closes without a request when nothing changed", async () => {
    const { onCloseAction } = renderDialog(portalCredentialFixture());
    submit(form.submitEdit);

    await waitFor(() => expect(onCloseAction).toHaveBeenCalledOnce());
    expect(api.update).not.toHaveBeenCalled();
  });

  it("keeps the input on a version conflict and retries against the new version", async () => {
    const entry = portalCredentialFixture({ version: 1 });
    const fresh = { ...entry, username: "neu@example.com", version: 2 };
    api.update
      .mockResolvedValueOnce({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        current: fresh,
      })
      .mockResolvedValueOnce({ ok: true, value: { ...fresh, version: 3 } });
    const { onCloseAction } = renderDialog(entry);

    type(form.fields.title, "Umbenannt");
    submit(form.submitEdit);
    expect(await screen.findByRole("alert")).toHaveTextContent(form.conflict);
    expect(field(form.fields.title)).toHaveValue("Umbenannt");
    // The untouched field adopts what someone else saved.
    expect(field(form.fields.username)).toHaveValue("neu@example.com");
    expect(onCloseAction).not.toHaveBeenCalled();

    submit(form.submitEdit);
    await waitFor(() => expect(onCloseAction).toHaveBeenCalledOnce());
    expect(api.update).toHaveBeenLastCalledWith(CUSTOMER_ID, entry.id, {
      version: 2,
      title: "Umbenannt",
    });
  });

  it("reveals a stored note for editing as an audited show, only with the right", async () => {
    api.reveal.mockResolvedValue({ ok: true, value: "Kundennummer 123" });
    const entry = portalCredentialFixture({ hasNote: true });
    renderDialog(entry);

    await act(async () => submit(form.note.reveal));

    expect(api.reveal).toHaveBeenCalledExactlyOnceWith(
      CUSTOMER_ID,
      entry.id,
      CredentialSecretField.Note,
      CredentialRevealIntent.Show,
    );
    expect(field(form.fields.note)).toHaveValue("Kundennummer 123");
    cleanup();

    renderDialog(entry, false);
    expect(screen.queryByRole("button", { name: form.note.reveal })).toBeNull();
    expect(
      screen.getByRole("button", { name: form.note.replace }),
    ).toBeEnabled();
  });
});
