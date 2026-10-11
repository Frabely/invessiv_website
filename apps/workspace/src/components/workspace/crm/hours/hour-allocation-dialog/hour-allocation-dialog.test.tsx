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
import { HoursLimits } from "@invessiv/common/constants/crm/hours-limits";
import type { HoursViewModel } from "@/common/contracts/crm/hours/hours-view-model";
import {
  project,
  viewModel,
} from "@/common/patterns/crm/hours/hours-test-fixtures";
import { getCrmHoursDictionary } from "@/i18n/dictionaries/workspace/crm";
import { fillDurationInput } from "@invessiv/ui/components/duration-input/duration-input.test-helper";
import { HourAllocationDialog } from "./hour-allocation-dialog";
import { HourAllocationDirection } from "@/common/constants/crm/hour-allocation-directions";

const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
const api = vi.hoisted(() => ({
  createPurchase: vi.fn(),
  createAllocation: vi.fn(),
}));
vi.mock("@/client/crm/hours-api-service", () => ({ hoursApiService: api }));
const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const content = getCrmHoursDictionary("de");
beforeEach(() => {
  refresh.mockReset();
  api.createPurchase.mockReset();
  api.createAllocation.mockReset();
});
afterEach(cleanup);

function renderDialog(model: HoursViewModel = viewModel(), release = false) {
  const selected = model.hours.projects[0];
  return render(
    <HourAllocationDialog
      content={content}
      customerId={CUSTOMER_ID}
      direction={
        release
          ? HourAllocationDirection.Release
          : HourAllocationDirection.Allocate
      }
      freeMinutes={model.hours.balance?.freeMinutes ?? 0}
      releasableMinutes={selected.releasableMinutes}
      onCloseAction={vi.fn()}
      projectId={selected.projectId}
      projectTitle={selected.title}
    />,
  );
}
function durationInput() {
  return screen.getByRole("spinbutton", {
    name: new RegExp(content.allocationDialog.minutes),
  });
}
describe("HourAllocationDialog", () => {
  it.each([false, true])(
    "caps one ledger transfer while showing the full stock (release: %s)",
    async (release) => {
      api.createAllocation.mockResolvedValue({ ok: true });
      renderDialog(
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
        release,
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

  it("sends a release as negative minutes and keeps one idempotency key across retries", async () => {
    api.createAllocation.mockResolvedValueOnce({
      ok: false,
      code: HoursErrorCode.Internal,
      balance: null,
      project: null,
    });
    api.createAllocation.mockResolvedValueOnce({ ok: true });
    renderDialog(undefined, true);

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
    renderDialog();

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
    renderDialog();

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
    renderDialog();

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
});
