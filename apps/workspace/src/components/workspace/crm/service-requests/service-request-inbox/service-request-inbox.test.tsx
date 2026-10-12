// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { SERVICE_REQUEST_STATUS_VALUES } from "@invessiv/common/constants/crm/service-request-statuses";
import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import { ServiceRequestInboxFilter as F } from "@/common/constants/crm/service-request-inbox-query-params";
import { serviceRequestFixture } from "@/server/tests/support/service-request-fixtures";
import { getCrmServiceRequestsDictionary } from "@/i18n/dictionaries/workspace/crm";
import { ServiceRequestInbox } from "./service-request-inbox";
import { ServiceRequestStatusBadge } from "@/components/shared/service-requests/service-request-status-badge/service-request-status-badge";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));
const content = getCrmServiceRequestsDictionary("en");
const props = {
  basePath: "/en/crm/service-requests",
  crmPath: "/en/crm",
  filter: F.Open,
  locale: "en" as const,
  content,
};
const page = { page: 1, perPage: 25, total: 0 };
afterEach(cleanup);
describe("ServiceRequestInbox", () => {
  it("explains the first empty inbox and distinguishes it from an empty open filter", () => {
    render(
      <ServiceRequestInbox
        {...props}
        inbox={{ ...page, items: [], hasRequests: false }}
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
        inbox={{ ...page, items: [], hasRequests: true }}
      />,
    );
    expect(
      screen.getByRole("heading", { name: content.noOpen.title }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: content.noOpen.action }),
    ).toHaveAttribute("href", "/en/crm/service-requests?filter=all");
  });
  it("lists customer text safely, hours and contact in the table, and links the request into the cockpit", () => {
    const request = serviceRequestFixture({
      kind: LineItemKind.Hours,
      requestedMinutes: 300,
    });
    render(
      <ServiceRequestInbox
        {...props}
        inbox={{ ...page, items: [request], hasRequests: true, total: 1 }}
      />,
    );
    expect(screen.getByText(request.note)).toBeVisible();
    expect(document.querySelector("b")).toBeNull();
    expect(screen.getByText(/Anna Berger/)).toBeVisible();
    expect(screen.getByText(/5:00/)).toBeVisible();
    const href = screen
      .getByRole("link", {
        name: formatMessage(content.table.openNamed, { name: request.title }),
      })
      .getAttribute("href")!;
    const url = new URL(href, "https://example.test");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      cockpit: request.customerId,
      serviceRequest: request.id,
    });
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      screen.getByRole("table", { name: content.table.caption }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: content.toolbar.reset }),
    ).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: content.actions.accept }),
    ).not.toBeInTheDocument();
  });
  it("pages through the inbox without dropping the filter", () => {
    render(
      <ServiceRequestInbox
        {...props}
        filter={F.All}
        inbox={{
          hasRequests: true,
          items: [serviceRequestFixture()],
          page: 2,
          perPage: 25,
          total: 60,
        }}
      />,
    );
    const pagination = within(
      screen.getByRole("navigation", {
        name: content.table.pagination.ariaLabel,
      }),
    );
    expect(pagination.getByText("26–50 of 60 requests")).toBeVisible();
    expect(
      pagination.getByRole("link", { name: content.table.pagination.next }),
    ).toHaveAttribute("href", "/en/crm/service-requests?filter=all&page=3");
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
