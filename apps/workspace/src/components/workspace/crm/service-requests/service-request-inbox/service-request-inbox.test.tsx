// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SERVICE_REQUEST_STATUS_VALUES } from "@invessiv/common/constants/crm/service-request-statuses";
import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import { ServiceRequestInboxFilter as F } from "@/common/constants/crm/service-request-inbox-query-params";
import { serviceRequestFixture } from "@/server/tests/support/service-request-fixtures";
import { getCrmServiceRequestsDictionary } from "@/i18n/dictionaries/workspace/crm";
import { ServiceRequestInbox } from "./service-request-inbox";
import { ServiceRequestStatusBadge } from "../service-request-status-badge/service-request-status-badge";

const content = getCrmServiceRequestsDictionary("en");
const props = {
  basePath: "/en/crm/service-requests",
  crmPath: "/en/crm",
  filter: F.Open,
  locale: "en" as const,
  content,
};
afterEach(cleanup);
describe("ServiceRequestInbox", () => {
  it("explains the first empty inbox and distinguishes it from an empty open filter", () => {
    render(
      <ServiceRequestInbox
        {...props}
        inbox={{ items: [], hasRequests: false }}
      />,
    );
    expect(
      screen.getByRole("heading", { name: content.empty.title }),
    ).toBeVisible();
    expect(screen.getByText(content.empty.description)).toBeVisible();
    expect(
      screen.queryByRole("link", { name: content.noOpen.action }),
    ).not.toBeInTheDocument();
    cleanup();
    render(
      <ServiceRequestInbox
        {...props}
        inbox={{ items: [], hasRequests: true }}
      />,
    );
    expect(
      screen.getByRole("heading", { name: content.noOpen.title }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: content.noOpen.action }),
    ).toHaveAttribute("href", "/en/crm/service-requests?filter=all");
  });
  it("shows full customer text safely, hours and contact, and links the highlighted request into the cockpit", () => {
    const request = serviceRequestFixture({
      kind: LineItemKind.Hours,
      requestedMinutes: 300,
    });
    render(
      <ServiceRequestInbox
        {...props}
        inbox={{ items: [request], hasRequests: true }}
      />,
    );
    expect(screen.getByText(request.note)).toBeVisible();
    expect(document.querySelector("b")).toBeNull();
    expect(screen.getByText(/Anna Berger/)).toBeVisible();
    expect(screen.getByText(/5:00/)).toBeVisible();
    const href = screen
      .getByRole("link", { name: content.card.open })
      .getAttribute("href")!;
    const url = new URL(href, "https://example.test");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      cockpit: request.customerId,
      serviceRequest: request.id,
    });
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.queryByRole("button", { name: content.actions.accept }),
    ).not.toBeInTheDocument();
  });
  it("represents every status with a word and a decorative icon", () => {
    for (const status of SERVICE_REQUEST_STATUS_VALUES) {
      const { container } = render(
        <ServiceRequestStatusBadge
          status={status}
          label={content.status[status]}
        />,
      );
      expect(screen.getByText(content.status[status])).toBeVisible();
      expect(container.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
      cleanup();
    }
  });
});
