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
import { afterEach, describe, expect, it, vi } from "vitest";
import { CredentialApiErrorCode } from "@invessiv/common/constants/credentials/credential-api-error-code";
import { CredentialRevealIntent } from "@invessiv/common/constants/credentials/credential-reveal-intents";
import { CredentialSecretField } from "@invessiv/common/constants/credentials/credential-secret-fields";
import { CredentialType } from "@invessiv/common/constants/credentials/credential-types";
import type { PortalCredentialListDto } from "@invessiv/common/contracts/portal/portal-credential-list.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import {
  portalCredentialFixture,
  portalCredentialListFixture,
} from "@/common/patterns/testing/portal-credential-fixture";
import { getPortalCredentialsDictionary } from "@/i18n/dictionaries/portal";
import { PortalCredentialsDialog } from "./portal-credentials-dialog";

const api = vi.hoisted(() => ({
  list: vi.fn(),
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
    list: api.list,
    create: api.create,
    update: api.update,
    reveal: api.reveal,
  },
}));

const content = getPortalCredentialsDictionary("de");
const CUSTOMER_ID = "customer-1";
const SECRET = "plaintext-secret-marker";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.useRealTimers();
});

async function renderDialog(
  list: PortalCredentialListDto = portalCredentialListFixture(),
  options: { cockpitHref?: string | null; startWithCreate?: boolean } = {},
) {
  api.list.mockResolvedValue({ ok: true, value: list });
  const handlers = { close: vi.fn(), saved: vi.fn() };
  const view = render(
    <PortalCredentialsDialog
      cockpitHref={options.cockpitHref ?? null}
      content={content}
      customerId={CUSTOMER_ID}
      locale="de"
      onCloseAction={handlers.close}
      onSavedAction={handlers.saved}
      startWithCreate={options.startWithCreate ?? false}
    />,
  );
  await waitFor(() =>
    expect(screen.queryByText(content.dialog.loading)).toBeNull(),
  );
  return { ...handlers, ...view };
}

const named = (template: string, name: string) =>
  formatMessage(template, { name });
const showSecret = (title: string) =>
  screen.getByRole("button", {
    name: named(
      content.secretField.showNamed,
      named(content.row.secretNamed, title),
    ),
  });

describe("PortalCredentialsDialog", () => {
  it("loads the list only when it opens and never renders a secret unasked", async () => {
    const { container } = await renderDialog();

    expect(api.list).toHaveBeenCalledExactlyOnceWith(CUSTOMER_ID);
    expect(
      screen.getByRole("dialog", { name: content.dialog.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(content.dialog.trust)).toBeInTheDocument();
    expect(screen.getByText(content.secretField.masked)).toBeInTheDocument();
    expect(container.innerHTML).not.toContain(SECRET);
    expect(api.reveal).not.toHaveBeenCalled();
  });

  it("offers a retry when the list cannot be loaded", async () => {
    api.list.mockResolvedValueOnce({
      ok: false,
      code: CredentialApiErrorCode.Internal,
    });
    render(
      <PortalCredentialsDialog
        cockpitHref={null}
        content={content}
        customerId={CUSTOMER_ID}
        locale="de"
        onCloseAction={vi.fn()}
        onSavedAction={vi.fn()}
        startWithCreate={false}
      />,
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      content.dialog.loadError,
    );

    api.list.mockResolvedValue({
      ok: true,
      value: portalCredentialListFixture(),
    });
    fireEvent.click(screen.getByRole("button", { name: content.dialog.retry }));

    expect(await screen.findByText("Domain bei IONOS")).toBeInTheDocument();
  });

  it("requests exactly one field through the portal endpoint and hides it again", async () => {
    api.reveal.mockResolvedValue({ ok: true, value: SECRET });
    const entry = portalCredentialFixture();
    await renderDialog(portalCredentialListFixture({ credentials: [entry] }));
    vi.useFakeTimers();

    await act(async () => fireEvent.click(showSecret(entry.title)));

    expect(api.reveal).toHaveBeenCalledExactlyOnceWith(
      CUSTOMER_ID,
      entry.id,
      CredentialSecretField.Secret,
      CredentialRevealIntent.Show,
    );
    expect(screen.getByText(SECRET)).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(31_000));
    expect(screen.queryByText(SECRET)).toBeNull();
  });

  it("explains a refused reveal in the portal's own words", async () => {
    api.reveal.mockResolvedValue({
      ok: false,
      code: CredentialApiErrorCode.RateLimited,
    });
    const entry = portalCredentialFixture();
    await renderDialog(portalCredentialListFixture({ credentials: [entry] }));

    await act(async () => fireEvent.click(showSecret(entry.title)));

    expect(screen.getByRole("alert")).toHaveTextContent(
      content.errors.rate_limited,
    );
  });

  it("offers reveal and copy only with canReveal, add and change only with canWrite", async () => {
    await renderDialog(
      portalCredentialListFixture({
        capabilities: { canWrite: false, canReveal: false },
      }),
    );

    for (const label of [
      content.secretField.show,
      content.secretField.copy,
      content.row.edit,
      content.actions.add,
    ])
      expect(
        screen.queryByRole("button", { name: new RegExp(label) }),
      ).toBeNull();
    // The login name is plaintext and stays copyable.
    expect(
      screen.getByRole("button", {
        name: named(content.row.copyUsernameNamed, "Domain bei IONOS"),
      }),
    ).toBeEnabled();
    cleanup();

    await renderDialog();
    expect(
      screen.getByRole("button", { name: content.actions.add }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", {
        name: named(content.row.editNamed, "Domain bei IONOS"),
      }),
    ).toBeEnabled();
  });

  it("groups general entries first and then by project, and marks own entries", async () => {
    await renderDialog(
      portalCredentialListFixture({
        credentials: [
          portalCredentialFixture({ id: "a", title: "Mailkonto" }),
          portalCredentialFixture({
            id: "b",
            title: "Vercel",
            projectId: "project-1",
            credentialType: CredentialType.Hosting,
            createdByCustomer: true,
          }),
        ],
        projects: [{ id: "project-1", title: "Relaunch" }],
      }),
    );

    const groups = screen.getAllByRole("region");
    expect(
      within(groups[0]).getByRole("heading", { name: content.groups.general }),
    ).toBeInTheDocument();
    expect(within(groups[0]).getByText("Mailkonto")).toBeInTheDocument();
    expect(
      within(groups[1]).getByRole("heading", { name: "Relaunch" }),
    ).toBeInTheDocument();
    expect(within(groups[1]).getByText("Vercel")).toBeInTheDocument();
    expect(
      within(groups[1]).getByText(content.row.fromYou),
    ).toBeInTheDocument();
    expect(within(groups[0]).queryByText(content.row.fromYou)).toBeNull();
  });

  it("explains in the empty state which logins are needed and that they are encrypted", async () => {
    await renderDialog(portalCredentialListFixture({ credentials: [] }));

    const description = screen.getByText(content.empty.description);
    expect(description).toHaveTextContent(/Domain-Anbieter/);
    expect(description).toHaveTextContent(/Hosting/);
    expect(description).toHaveTextContent(/E-Mail-Konto/);
    expect(description).toHaveTextContent(/verschlüsselt/);
  });

  it("gives the owner view the notice with the CRM link instead of any action", async () => {
    await renderDialog(
      portalCredentialListFixture({
        capabilities: { canWrite: false, canReveal: false },
      }),
      { cockpitHref: "/de/crm?customer=customer-1" },
    );

    expect(screen.getByText(content.owner.hint)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: content.owner.link }),
    ).toHaveAttribute("href", "/de/crm?customer=customer-1");
    expect(
      screen.queryByRole("button", { name: content.actions.add }),
    ).toBeNull();
  });

  it("says why nothing can be opened while encryption is not set up", async () => {
    await renderDialog(portalCredentialListFixture({ configured: false }));

    expect(screen.getByRole("note")).toHaveTextContent(
      content.notConfigured.title,
    );
    expect(
      screen.getByRole("button", { name: content.actions.add }),
    ).toBeDisabled();
  });

  it("swaps the list for the shared form, saves, and comes back to a reloaded list", async () => {
    api.create.mockResolvedValue({ ok: true, value: null });
    const { close, saved } = await renderDialog();

    fireEvent.click(screen.getByRole("button", { name: content.actions.add }));
    // One dialog at a time: the form replaces the list instead of stacking on it.
    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    const form = screen.getByRole("dialog", {
      name: content.form.titleCreate,
    });
    expect(within(form).getByText(content.form.notice)).toBeInTheDocument();
    fireEvent.change(
      within(form).getByLabelText(new RegExp(`^${content.form.fields.title}`)),
      { target: { value: "Neues Hosting" } },
    );
    fireEvent.change(
      within(form).getByLabelText(new RegExp(`^${content.form.fields.secret}`)),
      { target: { value: SECRET } },
    );
    await act(async () =>
      fireEvent.click(
        within(form).getByRole("button", { name: content.form.submitCreate }),
      ),
    );

    expect(api.create).toHaveBeenCalledExactlyOnceWith(
      CUSTOMER_ID,
      expect.objectContaining({ title: "Neues Hosting", secret: SECRET }),
    );
    expect(saved).toHaveBeenCalledWith(
      named(content.announcements.created, "Neues Hosting"),
    );
    // The dashboard's number follows through the refresh; the list reloads itself.
    expect(api.refresh).toHaveBeenCalled();
    await waitFor(() => expect(api.list).toHaveBeenCalledTimes(2));
    expect(
      screen.getByRole("dialog", { name: content.dialog.title }),
    ).toBeInTheDocument();
    expect(close).not.toHaveBeenCalled();
    expect(
      screen.getByRole("button", { name: content.actions.add }),
    ).toHaveFocus();
  });

  it("opens the form first when entered through the widget's add action and closes everything with it", async () => {
    const { close } = await renderDialog(portalCredentialListFixture(), {
      startWithCreate: true,
    });

    expect(
      screen.getByRole("dialog", { name: content.form.titleCreate }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: content.form.cancel }));

    expect(close).toHaveBeenCalledOnce();
  });

  it("opens the same form for changing an entry", async () => {
    const entry = portalCredentialFixture({ title: "Hosting alt" });
    await renderDialog(portalCredentialListFixture({ credentials: [entry] }));

    fireEvent.click(
      screen.getByRole("button", {
        name: named(content.row.editNamed, entry.title),
      }),
    );

    const form = screen.getByRole("dialog", { name: content.form.titleEdit });
    expect(
      within(form).getByLabelText(new RegExp(`^${content.form.fields.title}`)),
    ).toHaveValue("Hosting alt");
    fireEvent.click(
      within(form).getByRole("button", { name: content.form.cancel }),
    );
    expect(
      screen.getByRole("dialog", { name: content.dialog.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: named(content.row.editNamed, entry.title),
      }),
    ).toHaveFocus();
  });

  it("waits for the saved list and restores focus by id after a title change", async () => {
    const entry = portalCredentialFixture({ title: "Hosting alt" });
    const savedEntry = { ...entry, title: "Hosting neu", version: 2 };
    api.update.mockResolvedValue({ ok: true, value: savedEntry });
    await renderDialog(portalCredentialListFixture({ credentials: [entry] }));
    let resolveList!: (result: {
      ok: true;
      value: PortalCredentialListDto;
    }) => void;
    api.list.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveList = resolve;
        }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: named(content.row.editNamed, entry.title),
      }),
    );
    const form = screen.getByRole("dialog", { name: content.form.titleEdit });
    fireEvent.change(
      within(form).getByLabelText(new RegExp(`^${content.form.fields.title}`)),
      { target: { value: savedEntry.title } },
    );
    await act(async () =>
      fireEvent.click(
        within(form).getByRole("button", { name: content.form.submitEdit }),
      ),
    );
    expect(
      screen.getByRole("button", {
        name: named(content.row.editNamed, entry.title),
      }),
    ).not.toHaveFocus();

    await act(async () =>
      resolveList({
        ok: true,
        value: portalCredentialListFixture({ credentials: [savedEntry] }),
      }),
    );
    expect(
      screen.getByRole("button", {
        name: named(content.row.editNamed, savedEntry.title),
      }),
    ).toHaveFocus();
  });

  it.each([
    { credentials: [], configured: true },
    { credentials: [portalCredentialFixture()], configured: false },
  ])(
    "focuses close when the saved list has no available edit trigger",
    async (next) => {
      const entry = portalCredentialFixture();
      api.update.mockResolvedValue({
        ok: true,
        value: { ...entry, version: 2 },
      });
      await renderDialog();
      api.list.mockResolvedValueOnce({
        ok: true,
        value: portalCredentialListFixture(next),
      });
      fireEvent.click(
        screen.getByRole("button", {
          name: named(content.row.editNamed, entry.title),
        }),
      );
      const form = screen.getByRole("dialog", { name: content.form.titleEdit });
      fireEvent.change(
        within(form).getByLabelText(
          new RegExp(`^${content.form.fields.title}`),
        ),
        { target: { value: "Changed" } },
      );
      await act(async () =>
        fireEvent.click(
          within(form).getByRole("button", { name: content.form.submitEdit }),
        ),
      );
      await waitFor(() =>
        expect(
          screen.getByRole("button", {
            name: content.dialog.close,
          }),
        ).toHaveFocus(),
      );
    },
  );
});
