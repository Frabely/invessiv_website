// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ServiceRequestStatus } from "@invessiv/common/constants/crm/service-request-statuses";
import {
  serviceRequestFixture,
  serviceRequestsViewModelFixture,
} from "@/server/tests/support/service-request-fixtures";
import {
  getCrmProjectLineItemsDictionary,
  getCrmServiceRequestsDictionary,
} from "@/i18n/dictionaries/workspace/crm";
import { CustomerServiceRequestsSection } from "./customer-service-requests-section";

const mocks = vi.hoisted(() => ({
  query: "",
  refresh: vi.fn(),
  replace: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  usePathname: () => "/en/crm",
  useSearchParams: () => new URLSearchParams(mocks.query),
  useRouter: () => ({ refresh: mocks.refresh, replace: mocks.replace }),
}));
vi.mock(
  "../service-request-accept-dialog/service-request-accept-dialog",
  () => ({
    ServiceRequestAcceptDialog: () => <div role="dialog">Accept request</div>,
  }),
);
vi.mock("../service-request-offer-dialog/service-request-offer-dialog", () => ({
  ServiceRequestOfferDialog: () => <div role="dialog">Record offer</div>,
}));
vi.mock(
  "../service-request-withdraw-dialog/service-request-withdraw-dialog",
  () => ({
    ServiceRequestWithdrawDialog: () => (
      <div role="dialog">Customer declined</div>
    ),
  }),
);
vi.mock(
  "../service-request-decline-dialog/service-request-decline-dialog",
  () => ({
    ServiceRequestDeclineDialog: () => <div role="dialog">Decline request</div>,
  }),
);
const content = getCrmServiceRequestsDictionary("en");
const lineItemsContent = getCrmProjectLineItemsDictionary("en");
afterEach(cleanup);
beforeEach(() => {
  mocks.query = "";
});
describe("CustomerServiceRequestsSection", () => {
  it("does not show a placeholder when the customer has no request", () => {
    const { container } = render(
      <CustomerServiceRequestsSection
        viewModel={serviceRequestsViewModelFixture({ requests: [] })}
        content={content}
        lineItemsContent={lineItemsContent}
        locale="en"
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });
  it("never opens a foreign request id or a dialog without write access", () => {
    mocks.query = "serviceRequest=foreign&serviceRequestAction=accept";
    render(
      <CustomerServiceRequestsSection
        viewModel={serviceRequestsViewModelFixture()}
        content={content}
        lineItemsContent={lineItemsContent}
        locale="en"
      />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    cleanup();
    mocks.query =
      "serviceRequest=" +
      serviceRequestFixture().id +
      "&serviceRequestAction=decline";
    render(
      <CustomerServiceRequestsSection
        viewModel={serviceRequestsViewModelFixture({ canWrite: false })}
        content={content}
        lineItemsContent={lineItemsContent}
        locale="en"
      />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: content.actions.offered }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: content.actions.accept }),
    ).not.toBeInTheDocument();
  });
  it("highlights the selected request and opens only an allowed transition", () => {
    mocks.query =
      "serviceRequest=" +
      serviceRequestFixture().id +
      "&serviceRequestAction=accept";
    const { container } = render(
      <CustomerServiceRequestsSection
        viewModel={serviceRequestsViewModelFixture()}
        content={content}
        lineItemsContent={lineItemsContent}
        locale="en"
      />,
    );
    expect(screen.getByRole("dialog")).toBeVisible();
    expect(container.querySelector('li[data-selected="true"]')).not.toBeNull();
    cleanup();
    render(
      <CustomerServiceRequestsSection
        viewModel={serviceRequestsViewModelFixture({
          requests: [
            serviceRequestFixture({ status: ServiceRequestStatus.Withdrawn }),
          ],
        })}
        content={content}
        lineItemsContent={lineItemsContent}
        locale="en"
      />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("leads with the offer and offers acceptance as the main step only afterwards", () => {
    render(
      <CustomerServiceRequestsSection
        viewModel={serviceRequestsViewModelFixture()}
        content={content}
        lineItemsContent={lineItemsContent}
        locale="en"
      />,
    );
    expect(
      screen.getByRole("link", { name: content.actions.offered }),
    ).toBeVisible();
    expect(
      screen.queryByRole("link", { name: content.actions.customerDeclined }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: content.actions.acceptWithoutOffer }),
    ).toBeVisible();
    expect(
      screen.queryByRole("link", { name: content.actions.accept }),
    ).not.toBeInTheDocument();
    cleanup();
    render(
      <CustomerServiceRequestsSection
        viewModel={serviceRequestsViewModelFixture({
          requests: [
            serviceRequestFixture({
              status: ServiceRequestStatus.Offered,
              offeredAt: "2026-10-11T09:00:00.000Z",
            }),
          ],
        })}
        content={content}
        lineItemsContent={lineItemsContent}
        locale="en"
      />,
    );
    expect(
      screen.getByRole("link", { name: content.actions.accept }),
    ).toBeVisible();
    expect(
      screen.queryByRole("link", { name: content.actions.acceptWithoutOffer }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: content.actions.offered }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: content.actions.customerDeclined }),
    ).toBeVisible();
  });
  it("opens the offer and the customer's decline only where the status allows them", () => {
    const id = serviceRequestFixture().id;
    const offered = serviceRequestsViewModelFixture({
      requests: [
        serviceRequestFixture({ status: ServiceRequestStatus.Offered }),
      ],
    });
    const open = (
      query: string,
      viewModel = serviceRequestsViewModelFixture(),
    ) => {
      cleanup();
      mocks.query = "serviceRequest=" + id + "&serviceRequestAction=" + query;
      render(
        <CustomerServiceRequestsSection
          viewModel={viewModel}
          content={content}
          lineItemsContent={lineItemsContent}
          locale="en"
        />,
      );
      return screen.queryByRole("dialog");
    };
    expect(open("offer")).toHaveTextContent("Record offer");
    expect(open("withdraw")).toBeNull();
    expect(open("withdraw", offered)).toHaveTextContent("Customer declined");
    expect(open("offer", offered)).toBeNull();
  });
  it("keeps completed requests collapsed until the matching request is selected", () => {
    const done = serviceRequestFixture({
      id: "done",
      title: "Completed request",
      status: ServiceRequestStatus.Declined,
      declineReason: "Customer-visible reason",
    });
    const vm = serviceRequestsViewModelFixture({
      requests: [serviceRequestFixture(), done],
    });
    render(
      <CustomerServiceRequestsSection
        viewModel={vm}
        content={content}
        lineItemsContent={lineItemsContent}
        locale="en"
      />,
    );
    expect(screen.queryByText(done.title)).not.toBeInTheDocument();
    cleanup();
    mocks.query = "serviceRequest=done";
    render(
      <CustomerServiceRequestsSection
        viewModel={vm}
        content={content}
        lineItemsContent={lineItemsContent}
        locale="en"
      />,
    );
    expect(screen.getByText(done.title)).toBeVisible();
    expect(screen.getByText(done.declineReason!)).toBeVisible();
  });
});
