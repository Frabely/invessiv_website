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
import { HoursLimits } from "@invessiv/common/constants/crm/hours-limits";
import type { HoursViewModel } from "@/common/contracts/crm/hours/hours-view-model";
import { viewModel } from "@/common/patterns/crm/hours/hours-test-fixtures";
import { getCrmHoursDictionary } from "@/i18n/dictionaries/workspace/crm";
import { fillDurationInput } from "@invessiv/ui/components/duration-input/duration-input.test-helper";
import { HourPurchaseDialog } from "./hour-purchase-dialog";

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

function renderDialog(model: HoursViewModel = viewModel()) {
  return render(
    <HourPurchaseDialog
      balance={model.hours.balance!}
      content={content}
      customerId={CUSTOMER_ID}
      onCloseAction={vi.fn()}
      today={model.today}
    />,
  );
}
describe("HourPurchaseDialog", () => {
  it("lets a rejected correction switch back to a purchase when no free hours remain", async () => {
    api.createPurchase.mockResolvedValueOnce({
      ok: false,
      code: HoursErrorCode.BelowAllocatedHours,
      balance: { ...viewModel().hours.balance, freeMinutes: 0 },
    });
    api.createPurchase.mockResolvedValueOnce({ ok: true });
    renderDialog();

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

  it("bounds a correction by the per-entry ledger limit even with more free stock", async () => {
    api.createPurchase.mockResolvedValue({ ok: true });
    renderDialog(
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

  it("adds hours with the customer-visible note and today's date", async () => {
    api.createPurchase.mockResolvedValue({ ok: true });
    renderDialog();

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
