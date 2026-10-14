// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { ServiceRequestProjectWish } from "@invessiv/common/constants/crm/service-request-project-wishes";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
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
  it("shows and focuses an oversized project title without truncating the customer request", async () => {
    const request = serviceRequestFixture({
      title: "x".repeat(200),
      projectWish: ServiceRequestProjectWish.New,
      status: ServiceRequestStatus.Offered,
    });
    render(
      <ServiceRequestAcceptDialog
        request={request}
        viewModel={serviceRequestsViewModelFixture()}
        content={content}
        lineItemsContent={getCrmProjectLineItemsDictionary("en")}
        locale="en"
        onCloseAction={vi.fn()}
      />,
    );
    const title = screen.getByRole("textbox", {
      name: new RegExp(content.form.projectTitle),
    });
    expect(title).toHaveValue(request.title);
    expect(title).toHaveAttribute("maxlength", "160");
    expect(
      screen.getByText(
        formatMessage(content.form.projectTitleInvalid, { max: 160 }),
      ),
    ).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: content.form.accept }));
    await waitFor(() => expect(title).toHaveFocus());
    fireEvent.change(title, { target: { value: "Short project title" } });
    expect(title).not.toHaveAttribute("aria-invalid", "true");
    expect(screen.getByText(request.title)).toBeVisible();
  });
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
