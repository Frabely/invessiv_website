// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import type { FeedbackInboxItemDto } from "@invessiv/common/contracts/crm/feedback-inbox-item.dto";
import { getCrmFeedbackRoundsDictionary } from "@/i18n/dictionaries/workspace/crm";
import { FeedbackInbox } from "./feedback-inbox";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const content = getCrmFeedbackRoundsDictionary("en");
const NO_FILTERS = { status: null, unreadOnly: false, customerId: null };

function item(
  overrides: Partial<FeedbackInboxItemDto> = {},
): FeedbackInboxItemDto {
  return {
    id: "round-1",
    roundNumber: 2,
    status: FeedbackRoundStatus.Submitted,
    customerId: "customer-1",
    customerDisplayName: "Nordlicht GmbH",
    projectId: "project-1",
    projectTitle: "Relaunch",
    submittedAt: "2026-09-29T09:00:00.000Z",
    dueOn: "2026-10-03",
    itemCount: 3,
    fileCount: 1,
    excerpt: "<b>Logo</b> bitte größer",
    unread: true,
    ...overrides,
  };
}

function renderInbox(items: FeedbackInboxItemDto[], hasActiveFilters = false) {
  render(
    <FeedbackInbox
      basePath="/en/crm/feedback"
      content={content}
      crmPath="/en/crm"
      filters={NO_FILTERS}
      hasActiveFilters={hasActiveFilters}
      inbox={{ items, customers: [] }}
      locale="en"
    />,
  );
}

afterEach(cleanup);

describe("FeedbackInbox", () => {
  it("links each card to the cockpit with project and round open", () => {
    renderInbox([item()]);
    const link = screen.getByRole("link", {
      name: "Nordlicht GmbH, Relaunch: open feedback round 2",
    });
    const url = new URL(link.getAttribute("href") ?? "", "https://x.test");
    expect(url.pathname).toBe("/en/crm");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      cockpit: "customer-1",
      project: "project-1",
      feedbackRound: "round-1",
    });
  });

  it("marks new rounds with a symbol and a word, and shows customer text as text", () => {
    renderInbox([item(), item({ id: "round-2", unread: false })]);
    const [unread, read] = within(
      screen.getByRole("list", { name: content.inbox.listLabel }),
    ).getAllByRole("listitem");
    expect(within(unread).getByText(content.inbox.card.unread)).toBeVisible();
    expect(
      within(read).queryByText(content.inbox.card.unread),
    ).not.toBeInTheDocument();
    expect(within(unread).getByText("<b>Logo</b> bitte größer")).toBeVisible();
    expect(within(unread).getByText("3 items")).toBeVisible();
    expect(within(unread).getByText("1 file")).toBeVisible();
  });

  it("names an empty first item instead of leaving a gap", () => {
    renderInbox([item({ excerpt: null, fileCount: 0 })]);
    expect(screen.getByText(content.inbox.card.noExcerpt)).toBeVisible();
    expect(screen.queryByText(/file/)).not.toBeInTheDocument();
  });

  it("tells an empty inbox apart from an empty filter", () => {
    renderInbox([]);
    expect(
      screen.getByRole("heading", { name: content.inbox.empty.title }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: content.inbox.empty.action }),
    ).toHaveAttribute("href", "/en/crm");
    cleanup();

    renderInbox([], true);
    expect(
      screen.getByRole("heading", { name: content.inbox.noResults.title }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: content.inbox.noResults.action }),
    ).toHaveAttribute("href", "/en/crm/feedback");
  });

  it("has exactly one page heading", () => {
    renderInbox([item()]);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });
});
