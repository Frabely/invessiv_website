// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ServiceRequestStatus } from "@invessiv/common/constants/crm/service-request-statuses";
import {
  serviceRequestFixture,
  serviceRequestsViewModelFixture,
} from "@/server/tests/support/service-request-fixtures";
import { getCrmServiceRequestsDictionary } from "@/i18n/dictionaries/workspace/crm";
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
vi.mock(
  "../service-request-decline-dialog/service-request-decline-dialog",
  () => ({
    ServiceRequestDeclineDialog: () => <div role="dialog">Decline request</div>,
  }),
);
const content = getCrmServiceRequestsDictionary("en");
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
        locale="en"
      />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: content.actions.offered }),
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
        locale="en"
      />,
    );
    expect(screen.getByRole("dialog")).toBeVisible();
    expect(
      container.querySelector('article[data-highlighted="true"]'),
    ).not.toBeNull();
    cleanup();
    render(
      <CustomerServiceRequestsSection
        viewModel={serviceRequestsViewModelFixture({
          requests: [
            serviceRequestFixture({ status: ServiceRequestStatus.Withdrawn }),
          ],
        })}
        content={content}
        locale="en"
      />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
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
        locale="en"
      />,
    );
    expect(screen.getByText(done.title)).toBeVisible();
    expect(screen.getByText(done.declineReason!)).toBeVisible();
  });
});
