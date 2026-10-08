// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CredentialApiErrorCode } from "@invessiv/common/constants/credentials/credential-api-error-code";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { CREDENTIAL_LIMITS } from "@invessiv/common/constants/credentials/credential-limits";
import { CredentialRevealIntent } from "@invessiv/common/constants/credentials/credential-reveal-intents";
import { CredentialSecretField } from "@invessiv/common/constants/credentials/credential-secret-fields";
import { CredentialType } from "@invessiv/common/constants/credentials/credential-types";
import type { CredentialDto } from "@invessiv/common/contracts/credentials/credential.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { CustomerCredentialsQueryParam } from "@/common/constants/crm/credentials/customer-credentials-query-params";
import type { CredentialsViewModel } from "@/common/contracts/crm/credentials/credentials-view-model";
import { getCrmCredentialsDictionary } from "@/i18n/dictionaries/workspace/crm";
import { credentialFixture as credential } from "@/common/patterns/testing/credential-fixture";
import { CustomerCredentialsSection } from "./customer-credentials-section";

const mocks = vi.hoisted(() => ({
  remove: vi.fn(),
  list: vi.fn(),
  reveal: vi.fn(),
  refresh: vi.fn(),
  update: vi.fn(),
  search: "",
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/de/crm",
  useRouter: () => ({ refresh: mocks.refresh }),
  useSearchParams: () => new URLSearchParams(mocks.search),
}));
vi.mock("@/client/crm/credentials-api-service", () => ({
  credentialsApiService: {
    list: mocks.list,
    reveal: mocks.reveal,
    create: vi.fn(),
    update: mocks.update,
    remove: mocks.remove,
  },
}));

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const PROJECT_ID = "22222222-2222-4222-8222-222222222222";
const SECRET = "plaintext-secret-value";
const content = getCrmCredentialsDictionary("de");
const labels = content.secretField;

function viewModel(
  overrides: Partial<CredentialsViewModel> = {},
): CredentialsViewModel {
  const all = { customerWide: true, projectIds: [PROJECT_ID] };
  return {
    projects: [{ id: PROJECT_ID, title: "Website-Relaunch" }],
    read: all,
    write: all,
    reveal: all,
    configured: true,
    ...overrides,
  };
}

/** The cockpit starts every section collapsed; the tests look at the opened one. */
function renderSection(model: CredentialsViewModel = viewModel()) {
  const rendered = render(
    <CustomerCredentialsSection
      content={content}
      customerId={CUSTOMER_ID}
      locale="de"
      viewModel={model}
    />,
  );
  fireEvent.click(
    screen.getByRole("button", { name: content.section.expandLabel }),
  );
  return rendered;
}

function listed(credentials: CredentialDto[]) {
  mocks.list.mockResolvedValue({ ok: true, value: credentials });
}

const secretName = (entry: CredentialDto) =>
  formatMessage(content.row.secretNamed, { name: entry.title });
const showButton = (entry: CredentialDto) =>
  screen.getByRole("button", {
    name: formatMessage(labels.showNamed, { name: secretName(entry) }),
  });

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: state,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

beforeEach(() => {
  mocks.search = "";
  mocks.reveal.mockResolvedValue({ ok: true, value: SECRET });
});

afterEach(() => {
  cleanup();
  setVisibility("visible");
  vi.useRealTimers();
  vi.clearAllMocks();
  window.history.replaceState(null, "", "/");
});

describe("CustomerCredentialsSection", () => {
  it("clears a revealed value on a delete conflict and retries with the fresh version", async () => {
    const entry = credential();
    const fresh = { ...entry, title: "Changed title", version: 2 };
    listed([entry]);
    mocks.remove
      .mockResolvedValueOnce({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        current: fresh,
      })
      .mockResolvedValueOnce({ ok: true });
    renderSection();
    fireEvent.click(await waitFor(() => showButton(entry)));
    await screen.findByText(SECRET);
    fireEvent.click(
      screen.getByRole("button", {
        name: formatMessage(content.row.deleteNamed, { name: entry.title }),
      }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: content.delete.confirm }),
    );
    expect(
      await screen.findByText(content.delete.conflict),
    ).toBeInTheDocument();
    expect(screen.queryByText(SECRET)).toBeNull();
    fireEvent.click(
      screen.getByRole("button", { name: content.delete.confirm }),
    );
    await waitFor(() =>
      expect(mocks.remove).toHaveBeenLastCalledWith(entry.id, 2),
    );
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalled());
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("clears a revealed value when encryption becomes unavailable", async () => {
    const entry = credential();
    listed([entry]);
    const rendered = renderSection();
    fireEvent.click(await waitFor(() => showButton(entry)));
    await screen.findByText(SECRET);
    rendered.rerender(
      <CustomerCredentialsSection
        content={content}
        customerId={CUSTOMER_ID}
        locale="de"
        viewModel={viewModel({ configured: false })}
      />,
    );
    expect(screen.queryByText(SECRET)).toBeNull();
  });

  it("refreshes stale data when dismissing a failed delete", async () => {
    const entry = credential();
    listed([]);
    mocks.list.mockResolvedValueOnce({ ok: true, value: [entry] });
    mocks.remove.mockResolvedValueOnce({
      ok: false,
      code: CredentialApiErrorCode.NotFound,
    });
    renderSection();
    fireEvent.click(
      await screen.findByRole("button", {
        name: formatMessage(content.row.deleteNamed, { name: entry.title }),
      }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: content.delete.confirm }),
    );
    await screen.findByText(content.errors[CredentialApiErrorCode.NotFound]);
    fireEvent.click(
      screen.getByRole("button", { name: content.delete.cancel }),
    );
    expect(mocks.refresh).toHaveBeenCalledOnce();
    await screen.findByText(content.empty.title);
    expect(mocks.list).toHaveBeenCalledTimes(2);
    expect(screen.queryByText(entry.title)).toBeNull();
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: content.section.collapseLabel }),
      ).toHaveFocus(),
    );
  });

  it("reloads concurrent metadata after dismissing an edit conflict", async () => {
    const entry = credential();
    const fresh = { ...entry, title: "Concurrent title", version: 2 };
    listed([fresh]);
    mocks.list.mockResolvedValueOnce({ ok: true, value: [entry] });
    mocks.update.mockResolvedValueOnce({
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      current: fresh,
    });
    renderSection();
    fireEvent.click(
      await screen.findByRole("button", {
        name: formatMessage(content.row.editNamed, { name: entry.title }),
      }),
    );
    fireEvent.change(
      screen.getByLabelText(new RegExp(`^${content.form.fields.title}`)),
      { target: { value: "My title" } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: content.form.submitEdit }),
    );
    await screen.findByText(content.form.conflict);
    fireEvent.click(screen.getByRole("button", { name: content.form.cancel }));
    await screen.findByText(fresh.title);
    expect(mocks.list).toHaveBeenCalledTimes(2);
    expect(screen.queryByText(entry.title)).toBeNull();
  });

  it("returns focus to the section toggle after deleting the last row", async () => {
    const entry = credential();
    listed([]);
    mocks.list.mockResolvedValueOnce({ ok: true, value: [entry] });
    mocks.remove.mockResolvedValueOnce({ ok: true });
    renderSection();
    const trigger = await screen.findByRole("button", {
      name: formatMessage(content.row.deleteNamed, { name: entry.title }),
    });
    trigger.focus();
    fireEvent.click(trigger);
    fireEvent.click(
      screen.getByRole("button", { name: content.delete.confirm }),
    );
    await screen.findByText(content.empty.title);
    expect(trigger.isConnected).toBe(false);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: content.section.collapseLabel }),
      ).toHaveFocus(),
    );
  });

  it("restores focus to the edit action after moving the row to another group", async () => {
    const entry = credential();
    const moved = { ...entry, projectId: PROJECT_ID, version: 2 };
    listed([moved]);
    mocks.list.mockResolvedValueOnce({ ok: true, value: [entry] });
    mocks.update.mockResolvedValueOnce({ ok: true, value: moved });
    renderSection();
    const actionName = formatMessage(content.row.editNamed, {
      name: entry.title,
    });
    const trigger = await screen.findByRole("button", { name: actionName });
    trigger.focus();
    fireEvent.click(trigger);
    fireEvent.click(
      within(screen.getByRole("dialog")).getByLabelText(
        content.form.fields.project,
      ),
    );
    fireEvent.click(
      await screen.findByRole("option", { name: "Website-Relaunch" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: content.form.submitEdit }),
    );
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() =>
      expect(screen.getByRole("button", { name: actionName })).toHaveFocus(),
    );
    expect(trigger.isConnected).toBe(false);
    expect(mocks.update).toHaveBeenCalledWith(entry.id, {
      version: 1,
      projectId: PROJECT_ID,
    });
    expect(
      within(
        screen.getByRole("region", { name: "Website-Relaunch" }),
      ).getByText(entry.title),
    ).toBeInTheDocument();
  });
  it("restores focus by entry identity after renaming one of two identically named entries", async () => {
    const entry = credential();
    const other = credential({ id: "55555555-5555-4555-8555-555555555555" });
    const saved = { ...entry, title: "Renamed credential", version: 2 };
    listed([saved, other]);
    mocks.list.mockResolvedValueOnce({ ok: true, value: [entry, other] });
    mocks.update.mockResolvedValueOnce({ ok: true, value: saved });
    renderSection();
    const triggers = await screen.findAllByRole("button", {
      name: formatMessage(content.row.editNamed, { name: entry.title }),
    });
    fireEvent.click(triggers[0]);
    fireEvent.change(
      screen.getByLabelText(new RegExp(`^${content.form.fields.title}`)),
      { target: { value: saved.title } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: content.form.submitEdit }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole("button", {
          name: formatMessage(content.row.editNamed, { name: saved.title }),
        }),
      ).toHaveFocus(),
    );
    expect(
      screen.getByRole("button", {
        name: formatMessage(content.row.editNamed, { name: other.title }),
      }),
    ).not.toHaveFocus();
  });

  it("lists metadata grouped by scope without requesting any value", async () => {
    const wide = credential();
    const inProject = credential({
      id: "55555555-5555-4555-8555-555555555555",
      projectId: PROJECT_ID,
      title: "Vercel",
      credentialType: CredentialType.Hosting,
    });
    listed([wide, inProject]);
    const { container } = renderSection();

    const wideGroup = await screen.findByRole("region", {
      name: content.groups.customerWide,
    });
    const projectGroup = screen.getByRole("region", {
      name: "Website-Relaunch",
    });

    expect(within(wideGroup).getByText(wide.title)).toBeInTheDocument();
    expect(within(projectGroup).getByText("Vercel")).toBeInTheDocument();
    expect(
      within(wideGroup).getByText(content.types.domain_registrar),
    ).toBeInTheDocument();
    expect(screen.getAllByText(labels.masked)).toHaveLength(2);
    expect(mocks.list).toHaveBeenCalledWith(CUSTOMER_ID, undefined);
    expect(mocks.reveal).not.toHaveBeenCalled();
    expect(container.innerHTML).not.toContain(SECRET);
  });

  it("links only http(s) addresses and opens them safely", async () => {
    listed([
      credential(),
      credential({
        id: "66666666-6666-4666-8666-666666666666",
        title: "Intern",
        url: "javascript:alert(1)",
      }),
    ]);
    renderSection();

    const link = await screen.findByRole("link", {
      name: /example\.com\/login/,
    });

    expect(link).toHaveAttribute("href", "https://example.com/login");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByText("javascript:alert(1)").closest("a")).toBeNull();
    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("reveals exactly one field on request and announces it without the value", async () => {
    const entry = credential();
    listed([entry]);
    renderSection();

    fireEvent.click(await waitFor(() => showButton(entry)));

    expect(await screen.findByText(SECRET)).toBeInTheDocument();
    expect(mocks.reveal).toHaveBeenCalledExactlyOnceWith(
      entry.id,
      CredentialSecretField.Secret,
      CredentialRevealIntent.Show,
    );
    const announcement = formatMessage(labels.visibleAnnouncement, {
      name: secretName(entry),
      seconds: CREDENTIAL_LIMITS.autoHideSeconds,
    });
    expect(screen.getByText(announcement)).toHaveAttribute(
      "aria-live",
      "polite",
    );
    expect(announcement).not.toContain(SECRET);
    // The row now says that the entry was revealed, without reloading the list.
    expect(screen.queryByText(content.row.neverRevealed)).toBeNull();
    expect(mocks.list).toHaveBeenCalledOnce();
  });

  it("removes the value from the DOM after 30 seconds", async () => {
    const entry = credential();
    listed([entry]);
    const { container } = renderSection();
    const button = await waitFor(() => showButton(entry));
    vi.useFakeTimers();
    await act(async () => {
      fireEvent.click(button);
    });
    expect(screen.getByText(SECRET)).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(29_000));
    expect(screen.getByText(SECRET)).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1_000));

    expect(screen.queryByText(SECRET)).toBeNull();
    expect(container.innerHTML).not.toContain(SECRET);
    expect(screen.getByText(labels.masked)).toBeInTheDocument();
  });

  it("removes the value from the DOM when the tab goes to the background", async () => {
    const entry = credential();
    listed([entry]);
    const { container } = renderSection();
    fireEvent.click(await waitFor(() => showButton(entry)));
    await screen.findByText(SECRET);

    act(() => setVisibility("hidden"));

    expect(container.innerHTML).not.toContain(SECRET);
  });

  it("copies without showing and counts as its own intent", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const entry = credential();
    listed([entry]);
    const { container } = renderSection();

    fireEvent.click(
      await screen.findByRole("button", {
        name: formatMessage(labels.copyNamed, { name: secretName(entry) }),
      }),
    );

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(SECRET));
    expect(mocks.reveal).toHaveBeenCalledExactlyOnceWith(
      entry.id,
      CredentialSecretField.Secret,
      CredentialRevealIntent.Copy,
    );
    expect(container.innerHTML).not.toContain(SECRET);
  });

  it("shows why a reveal was refused", async () => {
    mocks.reveal.mockResolvedValue({
      ok: false,
      code: CredentialApiErrorCode.RateLimited,
    });
    const entry = credential();
    listed([entry]);
    renderSection();

    fireEvent.click(await waitFor(() => showButton(entry)));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      content.errors.rate_limited,
    );
  });

  it("stays read-only and says why without a keyring", async () => {
    const entry = credential();
    listed([entry]);
    renderSection(viewModel({ configured: false }));

    await screen.findByText(entry.title);

    expect(screen.getByText(content.notConfigured.title)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: content.actions.add }),
    ).toBeDisabled();
    expect(showButton(entry)).toBeDisabled();
    expect(
      screen.getByRole("button", {
        name: formatMessage(content.row.editNamed, { name: entry.title }),
      }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", {
        name: formatMessage(content.row.deleteNamed, { name: entry.title }),
      }),
    ).toBeEnabled();
  });

  it("explains the empty area and tells it apart from an empty filter", async () => {
    listed([]);
    const first = renderSection();
    expect(await screen.findByText(content.empty.title)).toBeInTheDocument();
    expect(screen.getByText(content.empty.description)).toBeInTheDocument();
    first.unmount();

    mocks.search = `${CustomerCredentialsQueryParam.Project}=customer`;
    renderSection();

    expect(
      await screen.findByText(content.empty.customerWideTitle),
    ).toBeInTheDocument();
    expect(screen.queryByText(content.empty.title)).toBeNull();
    expect(mocks.list).toHaveBeenLastCalledWith(CUSTOMER_ID, null);
  });

  it("keeps an empty project visible next to customer-wide entries", async () => {
    mocks.search = `${CustomerCredentialsQueryParam.Project}=${PROJECT_ID}`;
    listed([credential()]);
    renderSection();

    const projectGroup = await screen.findByRole("region", {
      name: "Website-Relaunch",
    });

    expect(
      within(projectGroup).getByText(content.groups.projectEmpty),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: content.groups.customerWide }),
    ).toBeInTheDocument();
    expect(mocks.list).toHaveBeenCalledWith(CUSTOMER_ID, PROJECT_ID);
  });

  it("offers a reload when the list fails", async () => {
    mocks.list.mockResolvedValueOnce({
      ok: false,
      code: CredentialApiErrorCode.Internal,
    });
    renderSection();

    fireEvent.click(
      await screen.findByRole("button", { name: content.section.retry }),
    );
    listed([credential()]);

    await waitFor(() => expect(mocks.list).toHaveBeenCalledTimes(2));
  });
});
