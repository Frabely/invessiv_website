// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HoursErrorCode } from "@invessiv/common/constants/crm/errors/hours-error-codes";
import { HourPurchaseKind } from "@invessiv/common/constants/crm/hour-purchase-kinds";
import { HourPurchaseSource } from "@invessiv/common/constants/crm/hour-purchase-sources";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { HoursLimits } from "@invessiv/common/constants/crm/hours-limits";
import type { CustomerHoursProjectDto } from "@invessiv/common/contracts/crm/hours/customer-hours-project.dto";
import type { HoursViewModel } from "@/common/contracts/crm/hours/hours-view-model";
import { getCrmHoursDictionary } from "@/i18n/dictionaries/workspace/crm";
import { fillDurationInput } from "@invessiv/ui/components/duration-input/duration-input.test-helper";
import { CustomerHoursSection } from "./customer-hours-section";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const api = vi.hoisted(() => ({
  createPurchase: vi.fn(),
  createAllocation: vi.fn(),
}));
vi.mock("@/client/crm/hours-api-service", () => ({ hoursApiService: api }));

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const content = getCrmHoursDictionary("de");

function project(
  overrides: Partial<CustomerHoursProjectDto> = {},
): CustomerHoursProjectDto {
  return {
    projectId: "33333333-3333-4333-8333-333333333333",
    title: "Relaunch",
    status: ProjectStatus.Active,
    allocatedMinutes: 300,
    usedMinutes: 150,
    goodwillMinutes: 0,
    remainingMinutes: 150,
    releasableMinutes: 150,
    ...overrides,
  };
}

function viewModel(overrides: Partial<HoursViewModel> = {}): HoursViewModel {
  return {
    canManage: true,
    writableProjectIds: [],
    bookedMinutesByTaskId: {},
    today: "2026-10-08",
    hours: {
      balance: {
        purchasedMinutes: 600,
        allocatedMinutes: 300,
        freeMinutes: 300,
        usedMinutes: 150,
        goodwillMinutes: 0,
        remainingMinutes: 450,
      },
      projects: [project()],
      purchases: [
        {
          id: "purchase-1",
          kind: HourPurchaseKind.Purchase,
          source: HourPurchaseSource.Manual,
          minutes: 600,
          purchasedOn: "2026-10-01",
          note: "Betreuungspaket 10 h",
          createdByMemberId: "member-1",
          createdAt: "2026-10-01T08:00:00.000Z",
        },
      ],
      allocations: [],
    },
    ...overrides,
  };
}

function renderSection(model: HoursViewModel = viewModel()) {
  return render(
    <CustomerHoursSection
      content={content}
      customerId={CUSTOMER_ID}
      locale="de"
      viewModel={model}
    />,
  );
}

function durationInput() {
  return screen.getByRole("spinbutton", {
    name: new RegExp(content.allocationDialog.minutes),
  });
}

describe("CustomerHoursSection", () => {
  it.each([true, false])(
    "shows time without a purchase ledger (billable: %s)",
    (billable) => {
      const usedMinutes = billable ? 60 : 0;
      const goodwillMinutes = billable ? 0 : 60;
      renderSection(
        viewModel({
          hours: {
            balance: {
              purchasedMinutes: 0,
              allocatedMinutes: 0,
              freeMinutes: 0,
              usedMinutes,
              goodwillMinutes,
              remainingMinutes: -usedMinutes,
            },
            projects: [
              project({
                allocatedMinutes: 0,
                usedMinutes,
                goodwillMinutes,
                remainingMinutes: -usedMinutes,
                releasableMinutes: 0,
              }),
            ],
            purchases: [],
            allocations: [],
          },
        }),
      );
      expect(screen.queryByText(content.empty.title)).not.toBeInTheDocument();
      expect(screen.getByLabelText(content.balance.label)).toBeVisible();
      expect(screen.getByText("Relaunch")).toBeVisible();
      if (billable)
        expect(screen.getByText("1:00 über dem Kontingent")).toBeVisible();
    },
  );

  it("lets a rejected correction switch back to a purchase when no free hours remain", async () => {
    api.createPurchase.mockResolvedValueOnce({
      ok: false,
      code: HoursErrorCode.BelowAllocatedHours,
      balance: { ...viewModel().hours.balance, freeMinutes: 0 },
    });
    api.createPurchase.mockResolvedValueOnce({ ok: true });
    renderSection();
    fireEvent.click(
      screen.getByRole("button", { name: content.section.purchaseAction }),
    );
    fireEvent.click(screen.getByLabelText(content.purchaseDialog.kind));
    fireEvent.click(
      screen.getByRole("option", {
        name: content.purchaseDialog.kindCorrection,
      }),
    );
    fillDurationInput(
      new RegExp(content.purchaseDialog.minutes),
      content.duration.minutes,
      "1",
      "00",
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: content.purchaseDialog.submitCorrection,
      }),
    );
    await screen.findByText(content.errors.BELOW_ALLOCATED_HOURS);
    fireEvent.click(screen.getByLabelText(content.purchaseDialog.kind));
    fireEvent.click(
      screen.getByRole("option", {
        name: content.purchaseDialog.kindPurchase,
      }),
    );
    fireEvent.click(
      screen
        .getAllByRole("button", { name: content.purchaseDialog.submitPurchase })
        .at(-1)!,
    );
    await waitFor(() => expect(api.createPurchase).toHaveBeenCalledTimes(2));
    expect(api.createPurchase.mock.calls[1][1]).toMatchObject({
      kind: HourPurchaseKind.Purchase,
      minutes: 60,
    });
  });

  it.each([false, true])(
    "caps one ledger transfer while showing the full stock (release: %s)",
    async (release) => {
      api.createAllocation.mockResolvedValue({ ok: true });
      renderSection(
        viewModel({
          hours: {
            ...viewModel().hours,
            balance: {
              ...viewModel().hours.balance!,
              freeMinutes: HoursLimits.MaxLedgerMinutes * 2,
            },
            projects: [
              project({ releasableMinutes: HoursLimits.MaxLedgerMinutes * 2 }),
            ],
          },
        }),
      );
      fireEvent.click(
        screen.getByRole("button", {
          name: release ? "Freigeben: Relaunch" : "Zuweisen: Relaunch",
        }),
      );
      expect(
        screen.getByText(release ? "Freigebbar: 20000:00" : "Frei: 20000:00"),
      ).toBeVisible();
      fireEvent.click(
        screen.getByRole("button", {
          name: content.allocationDialog.useMaximum,
        }),
      );
      fireEvent.click(
        screen.getByRole("button", {
          name: release
            ? content.allocationDialog.submitRelease
            : content.allocationDialog.submitAllocate,
        }),
      );
      await waitFor(() => expect(api.createAllocation).toHaveBeenCalled());
      expect(api.createAllocation.mock.calls[0][1]).toMatchObject({
        minutes: release
          ? -HoursLimits.MaxLedgerMinutes
          : HoursLimits.MaxLedgerMinutes,
      });
    },
  );

  it("bounds a correction by the per-entry ledger limit even with more free stock", async () => {
    api.createPurchase.mockResolvedValue({ ok: true });
    renderSection(
      viewModel({
        hours: {
          ...viewModel().hours,
          balance: {
            ...viewModel().hours.balance!,
            freeMinutes: HoursLimits.MaxLedgerMinutes * 2,
          },
        },
      }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: content.section.purchaseAction }),
    );
    fireEvent.click(screen.getByLabelText(content.purchaseDialog.kind));
    fireEvent.click(
      screen.getByRole("option", {
        name: content.purchaseDialog.kindCorrection,
      }),
    );
    fireEvent.keyDown(
      screen.getByRole("spinbutton", { name: /Stunden Stunden/ }),
      { key: "End" },
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: content.purchaseDialog.submitCorrection,
      }),
    );
    await waitFor(() => expect(api.createPurchase).toHaveBeenCalled());
    expect(api.createPurchase.mock.calls[0][1]).toMatchObject({
      minutes: -HoursLimits.MaxLedgerMinutes,
    });
  });

  it("shows allocation instants on the Berlin calendar day", () => {
    renderSection(
      viewModel({
        hours: {
          ...viewModel().hours,
          allocations: [
            {
              id: "allocation-1",
              projectId: project().projectId,
              minutes: 60,
              note: "Mitternacht",
              createdByMemberId: "member-1",
              createdAt: "2026-10-10T22:30:00.000Z",
            },
          ],
        },
      }),
    );
    expect(screen.getByText(/11\. Okt/)).toBeVisible();
  });
  beforeEach(() => {
    refresh.mockReset();
    api.createPurchase.mockReset();
    api.createAllocation.mockReset();
  });
  afterEach(cleanup);

  it("shows the stock, the split and the ledger with every figure as text", () => {
    renderSection();

    expect(screen.getByText("7:30 übrig")).toBeVisible();
    const balance = screen.getByLabelText(content.balance.label);
    expect(balance).toHaveTextContent("Gekauft10:00");
    expect(balance).toHaveTextContent("Frei5:00");
    expect(balance).toHaveTextContent("Rest7:30");
    expect(screen.getByText("Relaunch")).toBeVisible();
    expect(screen.getByText("Betreuungspaket 10 h")).toBeVisible();
    expect(screen.getByText("+10:00")).toBeVisible();
  });

  it("names an overdrawn project in words, not only by colour", () => {
    renderSection(
      viewModel({
        hours: {
          ...viewModel().hours,
          projects: [
            project({
              usedMinutes: 360,
              remainingMinutes: -60,
              releasableMinutes: 0,
            }),
          ],
        },
      }),
    );

    expect(screen.getByText("überzogen um 1:00")).toBeVisible();
    expect(
      screen.queryByRole("button", { name: /^Freigeben/ }),
    ).not.toBeInTheDocument();
  });

  it("renders no write action without the right to manage hours", () => {
    renderSection(viewModel({ canManage: false }));

    expect(
      screen.queryByRole("button", { name: content.section.purchaseAction }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Zuweisen/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /^Freigeben/ }),
    ).not.toBeInTheDocument();
  });

  it("shows a project-bound reader only its projects and explains the missing stock", () => {
    renderSection(
      viewModel({
        canManage: false,
        hours: { ...viewModel().hours, balance: null, purchases: [] },
      }),
    );

    expect(screen.getByText(content.balance.projectScopeHint)).toBeVisible();
    expect(
      screen.queryByLabelText(content.balance.label),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Relaunch")).toBeVisible();
  });

  it("explains the purpose of the area while nothing has been added", () => {
    renderSection(
      viewModel({
        hours: {
          balance: {
            purchasedMinutes: 0,
            allocatedMinutes: 0,
            freeMinutes: 0,
            usedMinutes: 0,
            goodwillMinutes: 0,
            remainingMinutes: 0,
          },
          projects: [project({ allocatedMinutes: 0, usedMinutes: 0 })],
          purchases: [],
          allocations: [],
        },
      }),
    );

    expect(screen.getByText(content.empty.title)).toBeVisible();
    expect(screen.getByText(content.empty.description)).toBeVisible();
  });

  it("sends a release as negative minutes and keeps one idempotency key across retries", async () => {
    api.createAllocation.mockResolvedValueOnce({
      ok: false,
      code: HoursErrorCode.Internal,
      balance: null,
      project: null,
    });
    api.createAllocation.mockResolvedValueOnce({ ok: true });
    renderSection();

    fireEvent.click(
      screen.getByRole("button", { name: "Freigeben: Relaunch" }),
    );
    fillDurationInput(
      new RegExp(content.allocationDialog.minutes),
      content.duration.minutes,
      "1",
      "30",
    );
    const submit = screen.getByRole("button", {
      name: content.allocationDialog.submitRelease,
    });
    fireEvent.click(submit);
    await screen.findByText(content.errors.INTERNAL);
    fireEvent.click(submit);
    await waitFor(() => expect(refresh).toHaveBeenCalled());

    expect(api.createAllocation).toHaveBeenCalledTimes(2);
    const [first, second] = api.createAllocation.mock.calls;
    expect(first[0]).toBe(CUSTOMER_ID);
    expect(first[1]).toMatchObject({
      projectId: project().projectId,
      minutes: -90,
    });
    expect(second[1].idempotencyKey).toBe(first[1].idempotencyKey);
  });

  it("adopts the real limit from a rejected allocation and keeps the input", async () => {
    api.createAllocation.mockResolvedValue({
      ok: false,
      code: HoursErrorCode.InsufficientFreeHours,
      balance: { ...viewModel().hours.balance, freeMinutes: 60 },
      project: project(),
    });
    renderSection();

    fireEvent.click(screen.getByRole("button", { name: "Zuweisen: Relaunch" }));
    expect(screen.getByText("Frei: 5:00")).toBeVisible();
    fillDurationInput(
      new RegExp(content.allocationDialog.minutes),
      content.duration.minutes,
      "2",
      "00",
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: content.allocationDialog.submitAllocate,
      }),
    );

    await screen.findByText(content.errors.INSUFFICIENT_FREE_HOURS);
    expect(screen.getByText("Frei: 1:00")).toBeVisible();
    expect(durationInput()).toHaveAttribute("aria-valuenow", "2");
  });

  it("requires a positive duration before allocating hours", () => {
    renderSection();

    fireEvent.click(screen.getByRole("button", { name: "Zuweisen: Relaunch" }));
    fillDurationInput(
      new RegExp(content.allocationDialog.minutes),
      content.duration.minutes,
      "0",
      "00",
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: content.allocationDialog.submitAllocate,
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      content.duration.required,
    );
    expect(api.createAllocation).not.toHaveBeenCalled();
  });

  it("steps the duration by fifteen minutes with the buttons", () => {
    renderSection();

    fireEvent.click(screen.getByRole("button", { name: "Zuweisen: Relaunch" }));
    fireEvent.click(
      screen.getByRole("button", { name: content.duration.increase }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: content.duration.increase }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: content.duration.decrease }),
    );

    expect(durationInput()).toHaveAttribute("aria-valuenow", "0");
    expect(
      screen.getByRole("spinbutton", { name: content.duration.minutes }),
    ).toHaveAttribute("aria-valuenow", "15");
  });

  it("adds hours with the customer-visible note and today's date", async () => {
    api.createPurchase.mockResolvedValue({ ok: true });
    renderSection();

    fireEvent.click(
      screen.getByRole("button", { name: content.section.purchaseAction }),
    );
    expect(screen.getByText(content.purchaseDialog.noteHint)).toBeVisible();
    fillDurationInput(
      new RegExp(content.purchaseDialog.minutes),
      content.duration.minutes,
      "10",
      "00",
    );
    fireEvent.change(
      screen.getByRole("textbox", { name: content.purchaseDialog.note }),
      { target: { value: "Paket" } },
    );
    // The dialog submits under the same words as the action that opened it.
    fireEvent.click(
      screen
        .getAllByRole("button", { name: content.purchaseDialog.submitPurchase })
        .at(-1)!,
    );

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(api.createPurchase).toHaveBeenCalledWith(
      CUSTOMER_ID,
      expect.objectContaining({
        kind: HourPurchaseKind.Purchase,
        minutes: 600,
        purchasedOn: "2026-10-08",
        note: "Paket",
      }),
    );
  });
});
