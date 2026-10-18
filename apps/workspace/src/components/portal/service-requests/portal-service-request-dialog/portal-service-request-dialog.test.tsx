// @vitest-environment jsdom

import {
  portalServices,
  requestableService,
  serviceRequest,
} from "@/test/fixtures/portal/portal-service-request-fixtures";
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
import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import { ServiceRequestProjectWish as Wish } from "@invessiv/common/constants/crm/service-request-project-wishes";

import { ServiceRequestStatus } from "@invessiv/common/constants/crm/service-request-statuses";
import { PortalServiceRequestErrorCode } from "@invessiv/common/constants/portal/portal-service-request-error-codes";
import type { PortalRequestableServiceDto } from "@invessiv/common/contracts/portal/portal-requestable-service.dto";
import type { PortalServiceRequestDto } from "@invessiv/common/contracts/portal/portal-service-request.dto";
import type { PortalServicesDto } from "@invessiv/common/contracts/portal/portal-services.dto";
import { PORTAL_SERVICE_REQUEST_CUSTOM } from "@/common/constants/portal/portal-dashboard-query-params";
import { getPortalServiceRequestsDictionary } from "@/i18n/dictionaries/portal";
import { PortalServiceRequestDialog } from "./portal-service-request-dialog";

const api = vi.hoisted(() => ({
  createRequest: vi.fn(),
  withdrawRequest: vi.fn(),
}));

vi.mock("@/client/portal/portal-service-requests-api-service", () => ({
  portalServiceRequestsApiService: api,
}));

const content = getPortalServiceRequestsDictionary("de");
const onChanged = vi.fn();
const onSelectionChange = vi.fn();
const onClose = vi.fn();

const PAGE: PortalRequestableServiceDto = requestableService({
  id: "service-page",
  title: "Unterseite",
  description: "Eine weitere Seite in deinem Layout.",
  projectIds: ["project-a", "project-b"],
});
const HOURS: PortalRequestableServiceDto = requestableService({
  ...PAGE,
  id: "service-hours",
  title: "Stundenpaket",
  description: "Stunden für kleine Änderungen.",
  kind: LineItemKind.Hours,
});

function request(
  overrides: Partial<PortalServiceRequestDto> = {},
): PortalServiceRequestDto {
  return serviceRequest({
    title: "Unterseite",
    note: "<b>Bitte bis Juni</b>",
    projectTitle: "Website",
    ...overrides,
  });
}

function services(
  overrides: Partial<PortalServicesDto> = {},
): PortalServicesDto {
  return portalServices({
    services: [PAGE, HOURS],
    projects: [
      { id: "project-a", title: "Website" },
      { id: "project-b", title: "Shop" },
    ],
    ...overrides,
  });
}

function renderDialog(
  dto: PortalServicesDto = services(),
  options: {
    initialSelection?: string | null;
    cockpitHref?: string | null;
    selectedProjectId?: string | null;
  } = {},
) {
  const view = (refreshing = false) => (
    <PortalServiceRequestDialog
      cockpitHref={options.cockpitHref ?? null}
      content={content}
      customerId="customer-1"
      initialSelection={options.initialSelection ?? null}
      locale="de"
      onChangedAction={onChanged}
      onCloseAction={onClose}
      onSelectionChangeAction={onSelectionChange}
      selectedProjectId={options.selectedProjectId ?? null}
      refreshing={refreshing}
      services={dto}
    />
  );
  const result = render(view());
  return {
    ...result,
    setRefreshing: (refreshing: boolean) => result.rerender(view(refreshing)),
  };
}

function choose(title: string) {
  fireEvent.click(screen.getByRole("button", { name: new RegExp(title) }));
}

function send() {
  fireEvent.click(screen.getByRole("button", { name: content.form.submit }));
}

describe("PortalServiceRequestDialog", () => {
  beforeEach(() => {
    api.createRequest.mockReset();
    api.withdrawRequest.mockReset();
    onChanged.mockReset();
    onSelectionChange.mockReset();
    onClose.mockReset();
  });

  afterEach(cleanup);

  it("locks the confirmation actions until the dashboard refresh has finished", async () => {
    api.createRequest.mockResolvedValue({ ok: true, value: true });
    const { setRefreshing } = renderDialog(services(), {
      initialSelection: PAGE.id,
      selectedProjectId: "project-a",
    });
    send();
    await screen.findByText(content.sent.title);
    setRefreshing(true);
    const another = screen.getByRole("button", { name: content.sent.another });
    expect(another).toBeDisabled();
    expect(
      screen.getByRole("button", { name: content.sent.mine }),
    ).toBeDisabled();
    fireEvent.click(another);
    fireEvent.click(screen.getByRole("button", { name: content.dialog.close }));
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    setRefreshing(false);
    expect(another).toBeEnabled();
    fireEvent.click(another);
    expect(onSelectionChange).toHaveBeenCalledWith(null);
  });

  it("lists the released services with their customer text and free text last, never a price", () => {
    renderDialog();

    const options = screen
      .getAllByRole("listitem")
      .map((item) => item.textContent);
    expect(options).toHaveLength(3);
    expect(options[0]).toContain("Unterseite");
    expect(options[0]).toContain("Eine weitere Seite in deinem Layout.");
    expect(options[2]).toContain(content.picker.customTitle);
    expect(document.body.textContent).not.toMatch(/€|EUR|Preis/);
  });

  it("explains an empty catalog and still offers free text", () => {
    renderDialog(services({ services: [] }));

    expect(screen.getByText(content.picker.emptyCatalog)).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
    expect(
      screen.getByRole("button", {
        name: new RegExp(content.picker.customTitle),
      }),
    ).toBeInTheDocument();
  });

  it("mirrors the chosen service into the URL and asks for the project", () => {
    renderDialog();

    choose("Unterseite");

    expect(onSelectionChange).toHaveBeenLastCalledWith("service-page");
    expect(
      screen.getByRole("group", { name: /Für welches Projekt/ }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(2);
  });

  it("asks no project question with exactly one project and names it as text", () => {
    renderDialog(
      services({ services: [{ ...PAGE, projectIds: ["project-b"] }] }),
      { initialSelection: "service-page" },
    );

    expect(screen.queryByRole("radio")).toBeNull();
    expect(screen.getByText("Für dein Projekt „Shop“")).toBeInTheDocument();
  });

  it("does not send an hours request without an amount", () => {
    renderDialog(services(), {
      initialSelection: "service-hours",
      selectedProjectId: "project-a",
    });

    send();

    expect(api.createRequest).not.toHaveBeenCalled();
    expect(screen.getByText(content.form.hours.required)).toBeInTheDocument();
  });

  it("sends hours picked by quick choice as minutes, without any price field", async () => {
    api.createRequest.mockResolvedValue({ ok: true, value: true });
    renderDialog(services(), {
      initialSelection: "service-hours",
      selectedProjectId: "project-a",
    });

    fireEvent.click(screen.getByRole("button", { name: "10 Stunden" }));
    send();

    await waitFor(() => expect(api.createRequest).toHaveBeenCalledTimes(1));
    const [customerId, body] = api.createRequest.mock.calls[0]!;
    expect(customerId).toBe("customer-1");
    expect(body).toMatchObject({
      lineItemTemplateId: "service-hours",
      title: null,
      requestedMinutes: 600,
      projectWish: Wish.Existing,
      projectId: "project-a",
    });
    expect(Object.keys(body).join(" ")).not.toMatch(/price|pricing|interval/i);
    expect(await screen.findByText(content.sent.title)).toBeInTheDocument();
    expect(onChanged).toHaveBeenCalledWith(
      "Deine Anfrage „Stundenpaket“ ist bei uns angekommen.",
    );
    // Dropping the selection from the URL is the dashboard's reload, not a second URL write here.
    expect(onSelectionChange).not.toHaveBeenCalledWith(null);
  });

  it("sends free text with a new venture and requires its description", async () => {
    api.createRequest.mockResolvedValue({ ok: true, value: true });
    renderDialog(services(), {
      initialSelection: PORTAL_SERVICE_REQUEST_CUSTOM,
    });

    fireEvent.change(
      screen.getByLabelText(new RegExp(content.form.title.label)),
      {
        target: { value: "Zweite Landingpage" },
      },
    );
    fireEvent.click(screen.getByLabelText(content.form.project.new));
    send();
    expect(api.createRequest).not.toHaveBeenCalled();
    expect(
      screen.getByText(content.form.description.required),
    ).toBeInTheDocument();

    fireEvent.change(
      screen.getByLabelText(new RegExp(content.form.description.label)),
      { target: { value: "Für unser Sommerangebot" } },
    );
    send();

    await waitFor(() => expect(api.createRequest).toHaveBeenCalledTimes(1));
    expect(api.createRequest.mock.calls[0]![1]).toMatchObject({
      lineItemTemplateId: null,
      title: "Zweite Landingpage",
      note: "Für unser Sommerangebot",
      projectWish: Wish.New,
      projectId: null,
    });
  });

  it("keeps the form and words the rejection when the server refuses", async () => {
    api.createRequest.mockResolvedValue({
      ok: false,
      code: PortalServiceRequestErrorCode.LimitReached,
    });
    renderDialog(services({ services: [{ ...PAGE, projectIds: [] }] }), {
      initialSelection: "service-page",
    });

    send();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      content.errors.limit_reached,
    );
    expect(onChanged).not.toHaveBeenCalled();
  });

  it("falls back to the selection for a service that is no longer offered", () => {
    renderDialog(services(), { initialSelection: "service-gone" });

    expect(screen.getByText(content.form.unavailable)).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("keeps the pending form mounted and locks switching, closing and repeated submits", async () => {
    let finish!: (result: { ok: true; value: true }) => void;
    api.createRequest.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    renderDialog(services(), {
      initialSelection: PAGE.id,
      selectedProjectId: "project-a",
    });

    send();

    const dialog = screen.getByRole("dialog");
    const back = screen.getByRole("button", { name: content.form.back });
    const close = screen.getByRole("button", { name: content.dialog.close });
    const mine = screen.getByRole("tab", {
      name: content.dialog.tabs.mineName,
    });
    expect(back).toBeDisabled();
    expect(close).toBeDisabled();
    expect(mine).toBeDisabled();
    expect(dialog).toHaveAttribute("aria-busy", "true");
    fireEvent.click(back);
    fireEvent.click(mine);
    fireEvent.click(close);
    fireEvent.keyDown(mine, { key: "ArrowLeft" });
    fireEvent.keyDown(dialog, { key: "Escape" });
    fireEvent(dialog, new Event("cancel", { cancelable: true }));
    fireEvent.mouseDown(dialog);
    fireEvent.submit(dialog.querySelector("form")!);
    expect(
      screen.getByRole("heading", { name: PAGE.title }),
    ).toBeInTheDocument();
    expect(onSelectionChange).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(api.createRequest).toHaveBeenCalledTimes(1);

    await act(async () => {
      finish({ ok: true, value: true });
    });

    expect(screen.getByText(content.sent.title)).toBeInTheDocument();
    expect(mine).toBeEnabled();
    expect(close).toBeEnabled();
    expect(onChanged).toHaveBeenCalledTimes(1);
  });

  it("keeps an uncertain attempt locked and retries its unchanged payload", async () => {
    api.createRequest.mockResolvedValueOnce({
      ok: false,
      code: PortalServiceRequestErrorCode.Internal,
    });
    api.createRequest.mockResolvedValueOnce({ ok: true, value: true });
    renderDialog(services(), {
      initialSelection: PAGE.id,
      selectedProjectId: "project-a",
    });

    send();
    expect(await screen.findByRole("alert")).toHaveTextContent(
      content.errors.internal,
    );
    expect(
      screen.getByRole("button", { name: content.form.back }),
    ).toBeDisabled();
    expect(
      screen.getByRole("tab", { name: content.dialog.tabs.mineName }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: content.dialog.close }),
    ).toBeDisabled();
    const firstKey = api.createRequest.mock.calls[0]![1].idempotencyKey;

    send();
    expect(await screen.findByText(content.sent.title)).toBeInTheDocument();
    expect(api.createRequest.mock.calls[1]![1].idempotencyKey).toBe(firstKey);
  });
  it("refuses edited hours after a lost response and confirms the original attempt", async () => {
    api.createRequest.mockResolvedValueOnce({
      ok: false,
      code: PortalServiceRequestErrorCode.Internal,
    });
    api.createRequest.mockResolvedValueOnce({ ok: true, value: true });
    renderDialog(services(), {
      initialSelection: HOURS.id,
      selectedProjectId: "project-a",
    });
    fireEvent.click(screen.getByRole("button", { name: "5 Stunden" }));
    send();
    await screen.findByRole("alert");
    const hours = screen.getByRole("spinbutton");
    expect(hours).toBeDisabled();
    fireEvent.change(hours, { target: { value: "10" } });
    fireEvent.click(screen.getByRole("button", { name: "10 Stunden" }));
    send();
    await screen.findByText(content.sent.title);
    expect(api.createRequest.mock.calls[0]![1]).toMatchObject({
      requestedMinutes: 300,
    });
    expect(api.createRequest.mock.calls[1]![1]).toEqual(
      api.createRequest.mock.calls[0]![1],
    );
  });
  it("announces the original free-text title after an uncertain retry", async () => {
    api.createRequest.mockResolvedValueOnce({
      ok: false,
      code: PortalServiceRequestErrorCode.Internal,
    });
    api.createRequest.mockResolvedValueOnce({ ok: true, value: true });
    renderDialog(services(), {
      initialSelection: PORTAL_SERVICE_REQUEST_CUSTOM,
    });
    const title = screen.getByRole("textbox", {
      name: new RegExp(content.form.title.label),
    });
    fireEvent.change(title, { target: { value: "Original request" } });
    fireEvent.change(
      screen.getByRole("textbox", {
        name: new RegExp(content.form.description.label),
      }),
      { target: { value: "Original scope" } },
    );
    fireEvent.click(
      screen.getByRole("radio", { name: content.form.project.new }),
    );
    send();
    await screen.findByRole("alert");
    expect(title).toBeDisabled();
    fireEvent.change(title, { target: { value: "Changed request" } });
    send();
    await screen.findByText(content.sent.title);
    expect(api.createRequest.mock.calls[1]![1]).toEqual(
      api.createRequest.mock.calls[0]![1],
    );
    expect(onChanged).toHaveBeenCalledWith(
      expect.stringContaining("Original request"),
    );
  });

  it("ignores a late success after external navigation unmounts the form", async () => {
    let finish!: (result: { ok: true; value: true }) => void;
    api.createRequest.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const view = renderDialog(services(), {
      initialSelection: PAGE.id,
      selectedProjectId: "project-a",
    });
    send();
    view.unmount();

    await act(async () => {
      finish({ ok: true, value: true });
    });

    expect(onChanged).not.toHaveBeenCalled();
    expect(onSelectionChange).not.toHaveBeenCalled();
  });

  it("counts only closed requests towards the history notice", () => {
    renderDialog(
      services({
        requests: Array.from({ length: 20 }, (_, index) =>
          request({ id: `open-${index}` }),
        ),
      }),
    );
    fireEvent.click(
      screen.getByRole("tab", { name: content.dialog.tabs.mineName }),
    );

    expect(screen.queryByText(/letzten 20 abgeschlossenen/)).toBeNull();
  });

  it("explains the closed history cap while keeping older open requests reachable", () => {
    renderDialog(
      services({
        requests: [
          ...Array.from({ length: 20 }, (_, index) =>
            request({
              id: `closed-${index}`,
              status: ServiceRequestStatus.Withdrawn,
              canWithdraw: false,
            }),
          ),
          request({ title: "Old open request" }),
        ],
      }),
    );
    fireEvent.click(
      screen.getByRole("tab", { name: content.dialog.tabs.mineName }),
    );

    expect(
      screen.getByText(
        "Du siehst alle offenen und die letzten 20 abgeschlossenen Anfragen.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Anfrage „Old open request“ zurückziehen",
      }),
    ).toBeEnabled();
  });

  it("gives the owner view no active send button and points it to the CRM", () => {
    renderDialog(services({ canRequest: false }), {
      initialSelection: "service-page",
      cockpitHref: "/de/crm?customer=customer-1",
    });

    expect(
      screen.getByRole("button", { name: content.form.submit }),
    ).toBeDisabled();
    expect(screen.getByText(content.dialog.ownerHint)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: content.dialog.ownerLink }),
    ).toHaveAttribute("href", "/de/crm?customer=customer-1");
  });

  it("tells nothing requested yet apart from an empty catalog", () => {
    renderDialog(services({ services: [] }));

    fireEvent.click(screen.getByRole("tab", { name: /Meine Anfragen/ }));

    expect(screen.getByText(content.list.empty)).toBeInTheDocument();
    expect(screen.queryByText(content.picker.emptyCatalog)).toBeNull();
  });

  it("shows own requests with status as text and customer text never as markup", () => {
    renderDialog(
      services({
        requests: [
          request(),
          request({
            id: "request-2",
            title: "Stundenpaket",
            kind: LineItemKind.Hours,
            requestedMinutes: 300,
            status: ServiceRequestStatus.Declined,
            declineReason: "Dieses Jahr nicht mehr",
            canWithdraw: false,
          }),
        ],
      }),
    );

    fireEvent.click(screen.getByRole("tab", { name: /Meine Anfragen/ }));

    const rows = screen.getAllByRole("listitem");
    expect(rows).toHaveLength(2);
    expect(within(rows[0]!).getByText("Eingegangen")).toBeInTheDocument();
    expect(
      within(rows[0]!).getByText("<b>Bitte bis Juni</b>"),
    ).toBeInTheDocument();
    expect(rows[0]!.querySelector("b")).toBeNull();
    expect(within(rows[1]!).getByText("Abgelehnt")).toBeInTheDocument();
    expect(
      within(rows[1]!).getByText("Dieses Jahr nicht mehr"),
    ).toBeInTheDocument();
    expect(within(rows[1]!).getByText("5:00 Stunden")).toBeInTheDocument();
    expect(
      within(rows[1]!).queryByRole("button", { name: /zurückziehen/i }),
    ).toBeNull();
  });

  it("withdraws only after the confirmation and announces it", async () => {
    api.withdrawRequest.mockResolvedValue({ ok: true, value: true });
    renderDialog(services({ requests: [request()] }));

    fireEvent.click(screen.getByRole("tab", { name: /Meine Anfragen/ }));
    fireEvent.click(
      screen.getByRole("button", {
        name: "Anfrage „Unterseite“ zurückziehen",
      }),
    );
    expect(api.withdrawRequest).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole("button", { name: content.list.confirm.confirm }),
    );

    await waitFor(() =>
      expect(api.withdrawRequest).toHaveBeenCalledWith(
        "customer-1",
        "request-1",
      ),
    );
    await waitFor(() =>
      expect(onChanged).toHaveBeenCalledWith("„Unterseite“ ist zurückgezogen."),
    );
  });

  it("says so when the team already works on a request", async () => {
    api.withdrawRequest.mockResolvedValue({
      ok: false,
      code: PortalServiceRequestErrorCode.Locked,
    });
    renderDialog(services({ requests: [request()] }));

    fireEvent.click(screen.getByRole("tab", { name: /Meine Anfragen/ }));
    fireEvent.click(
      screen.getByRole("button", {
        name: "Anfrage „Unterseite“ zurückziehen",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: content.list.confirm.confirm }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      content.errors.locked,
    );
    expect(onChanged).not.toHaveBeenCalled();
  });
});
