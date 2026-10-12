// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ServiceRequestStatus } from "@invessiv/common/constants/crm/service-request-statuses";
import {
  serviceRequestFixture,
  serviceRequestsViewModelFixture,
} from "@/server/tests/support/service-request-fixtures";
import {
  getCrmProjectLineItemsDictionary,
  getCrmServiceRequestsDictionary,
} from "@/i18n/dictionaries/workspace/crm";
import { ServiceRequestAcceptDialog } from "./service-request-accept-dialog";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
}));
const content = getCrmServiceRequestsDictionary("en");
afterEach(cleanup);

function renderDialog(
  status: ServiceRequestStatus,
  viewModel = serviceRequestsViewModelFixture(),
) {
  render(
    <ServiceRequestAcceptDialog
      request={serviceRequestFixture({ status })}
      viewModel={viewModel}
      content={content}
      lineItemsContent={getCrmProjectLineItemsDictionary("en")}
      locale="en"
      onCloseAction={vi.fn()}
    />,
  );
  return screen.getByRole("button", { name: content.form.accept });
}

describe("ServiceRequestAcceptDialog", () => {
  it("locks accepting without an offer until it is confirmed on purpose", () => {
    const submit = renderDialog(ServiceRequestStatus.Requested);
    expect(
      screen.getByRole("dialog", {
        name: content.form.acceptWithoutOfferTitle,
      }),
    ).toBeVisible();
    expect(screen.getByText(content.form.withoutOfferNotice)).toBeVisible();
    expect(submit).toBeDisabled();
    fireEvent.click(
      screen.getByRole("checkbox", { name: content.form.withoutOfferConfirm }),
    );
    expect(submit).toBeEnabled();
  });
  it("names the missing catalog right instead of an empty template list", () => {
    const submit = renderDialog(
      ServiceRequestStatus.Offered,
      serviceRequestsViewModelFixture({
        templates: [],
        canReadTemplates: false,
      }),
    );
    expect(screen.getByText(content.form.noCatalogAccess)).toBeVisible();
    expect(screen.queryByText(content.form.noTemplate)).not.toBeInTheDocument();
    expect(submit).toBeDisabled();
  });
  it("asks for no confirmation once an offer was sent", () => {
    const submit = renderDialog(ServiceRequestStatus.Offered);
    expect(
      screen.getByRole("dialog", { name: content.form.acceptTitle }),
    ).toBeVisible();
    expect(screen.getByText(content.form.offeredNotice)).toBeVisible();
    expect(
      screen.queryByRole("checkbox", {
        name: content.form.withoutOfferConfirm,
      }),
    ).not.toBeInTheDocument();
    expect(submit).toBeEnabled();
  });
});
