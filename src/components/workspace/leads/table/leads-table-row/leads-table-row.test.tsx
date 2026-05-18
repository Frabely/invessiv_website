// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LeadSummaryDto } from "@/common/contracts/leads/lead-summary.dto";
import {
  getLeadsDeleteDictionary,
  getLeadsOutreachDictionary,
  getLeadsSharedDictionary,
  getLeadsTableDictionary,
} from "@/i18n/dictionaries/workspace/leads";
import { LeadsTableRow } from "./leads-table-row";

const pushMock = vi.fn();
const toggleRowMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock(
  "../leads-table-selection-provider/leads-table-selection-context",
  () => ({
    useLeadsTableSelection: () => ({
      isSelected: () => false,
      toggleRow: toggleRowMock,
    }),
  }),
);

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  pushMock.mockReset();
});

describe("LeadsTableRow", () => {
  it("builds the edit action link with mode=edit", () => {
    const lead: LeadSummaryDto = {
      id: "lead-123",
      displayName: "Anna Meyer",
      firstName: "Anna",
      lastName: "Meyer",
      companyName: "Acme",
      email: "anna@example.com",
      phone: null,
      websiteUrl: null,
      score: 82,
      source: "manual",
      leadStatus: "qualified",
      owner: null,
      createdAt: "2026-05-01T10:00:00.000Z",
      updatedAt: "2026-05-02T10:00:00.000Z",
      category: {
        id: "cat-1",
        slug: "coaches",
        labelKey: "coaches",
      },
      socialProfiles: [],
    };

    render(
      <table>
        <tbody>
          <LeadsTableRow
            basePath="/de/workspace/leads"
            currentQueryString="status=qualified&selected=lead-999"
            currentSearchParams={{
              selected: "lead-999",
              status: "qualified",
            }}
            deleteContent={getLeadsDeleteDictionary("de")}
            lead={lead}
            locale="de"
            outreachContent={getLeadsOutreachDictionary("de")}
            sharedContent={getLeadsSharedDictionary("de")}
            tableContent={getLeadsTableDictionary("de")}
          />
        </tbody>
      </table>,
    );

    const editButton = screen.getByRole("button", {
      name: getLeadsTableDictionary("de").actions.edit,
    });
    fireEvent.click(editButton);

    const calledUrl = new URL(
      pushMock.mock.calls[0][0],
      "https://invessiv.com",
    );
    expect(calledUrl.pathname).toBe("/de/workspace/leads");
    expect(calledUrl.searchParams.get("mode")).toBe("edit");
    expect(calledUrl.searchParams.get("edit")).toBe("lead-123");
    expect(calledUrl.searchParams.get("selected")).toBe("lead-999");
    expect(calledUrl.searchParams.get("status")).toBe("qualified");
  });

  it("does not trigger row navigation when the outreach button receives Space", () => {
    const tableContent = getLeadsTableDictionary("de");
    const outreachContent = getLeadsOutreachDictionary("de");
    const lead: LeadSummaryDto = {
      id: "lead-123",
      displayName: "Anna Meyer",
      firstName: "Anna",
      lastName: "Meyer",
      companyName: "Acme",
      email: "anna@example.com",
      phone: null,
      websiteUrl: null,
      score: 82,
      source: "manual",
      leadStatus: "qualified",
      owner: null,
      createdAt: "2026-05-01T10:00:00.000Z",
      updatedAt: "2026-05-02T10:00:00.000Z",
      category: {
        id: "cat-1",
        slug: "coaches",
        labelKey: "coaches",
      },
      socialProfiles: [],
    };

    render(
      <table>
        <tbody>
          <LeadsTableRow
            basePath="/de/workspace/leads"
            currentQueryString="status=qualified"
            currentSearchParams={{
              status: "qualified",
            }}
            deleteContent={getLeadsDeleteDictionary("de")}
            lead={lead}
            locale="de"
            outreachContent={outreachContent}
            sharedContent={getLeadsSharedDictionary("de")}
            tableContent={tableContent}
          />
        </tbody>
      </table>,
    );

    const outreachButton = screen.getByRole("button", {
      name: outreachContent.triggerLabel,
    });
    fireEvent.keyDown(outreachButton, { key: " ", code: "Space" });

    expect(pushMock).not.toHaveBeenCalled();
  });
});
