// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { HoursViewModel } from "@/common/contracts/crm/hours/hours-view-model";
import {
  project,
  viewModel,
} from "@/common/patterns/crm/hours/hours-test-fixtures";
import { getCrmHoursDictionary } from "@/i18n/dictionaries/workspace/crm";
import { CustomerHoursSection } from "./customer-hours-section";

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

  it("opens purchase and allocation forms from their section actions", () => {
    renderSection();
    fireEvent.click(
      screen.getByRole("button", { name: content.section.purchaseAction }),
    );
    expect(screen.getByRole("dialog")).toHaveTextContent(
      content.purchaseDialog.title,
    );
    fireEvent.click(
      screen.getByRole("button", { name: content.purchaseDialog.cancel }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Zuweisen: Relaunch" }));
    expect(screen.getByRole("dialog")).toHaveTextContent(
      content.allocationDialog.submitAllocate,
    );
  });
});
