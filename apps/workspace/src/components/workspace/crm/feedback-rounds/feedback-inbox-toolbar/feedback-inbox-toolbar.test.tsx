// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import type { FeedbackInboxFilters } from "@/common/contracts/crm/feedback-inbox-filters";
import { getCrmFeedbackRoundsDictionary } from "@/i18n/dictionaries/workspace/crm";
import { FeedbackInboxToolbar } from "./feedback-inbox-toolbar";

const mocks = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mocks.push }),
}));

const BASE = "/en/crm/feedback";
const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const content = getCrmFeedbackRoundsDictionary("en");
const toolbar = content.inbox.toolbar;
const NO_FILTERS: FeedbackInboxFilters = {
  status: null,
  unreadOnly: false,
  customerId: null,
};

function renderToolbar(filters: FeedbackInboxFilters = NO_FILTERS) {
  render(
    <FeedbackInboxToolbar
      basePath={BASE}
      content={content}
      customers={[{ id: CUSTOMER_ID, displayName: "Nordlicht GmbH" }]}
      filters={filters}
      hasActiveFilters={filters !== NO_FILTERS}
    />,
  );
}

beforeEach(() => {
  mocks.push.mockReset();
});

afterEach(cleanup);

describe("FeedbackInboxToolbar", () => {
  it("writes a status into the URL and keeps the other filters", () => {
    renderToolbar({ ...NO_FILTERS, unreadOnly: true });
    fireEvent.click(
      screen.getByRole("button", {
        name: content.status[FeedbackRoundStatus.InDiscussion],
      }),
    );
    expect(mocks.push).toHaveBeenCalledWith(
      `${BASE}?status=in_discussion&unread=1`,
      { scroll: false },
    );
  });

  it("toggles the unread filter by keyboard-reachable checkbox", () => {
    renderToolbar();
    fireEvent.click(screen.getByRole("checkbox", { name: toolbar.unreadOnly }));
    expect(mocks.push).toHaveBeenCalledWith(`${BASE}?unread=1`, {
      scroll: false,
    });
  });

  it("resets to the plain address and is disabled without filters", () => {
    renderToolbar();
    expect(screen.getByRole("button", { name: toolbar.reset })).toBeDisabled();
    cleanup();

    renderToolbar({ ...NO_FILTERS, customerId: CUSTOMER_ID });
    fireEvent.click(screen.getByRole("button", { name: toolbar.reset }));
    expect(mocks.push).toHaveBeenCalledWith(BASE, { scroll: false });
  });
});
