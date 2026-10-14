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
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import { BillingInterval } from "@invessiv/common/constants/crm/billing-intervals";
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

const mocks = vi.hoisted(() => ({ accept: vi.fn() }));
vi.mock("@/client/crm/service-requests-api-service", () => ({
  serviceRequestsApiService: { accept: mocks.accept },
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
}));
const content = getCrmServiceRequestsDictionary("en");
const lineItemsContent = getCrmProjectLineItemsDictionary("en");
beforeEach(() => mocks.accept.mockReset());
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
  it.each([false, true])(
    "reconciles a concurrently recorded offer before retrying acceptance: edited=%s",
    async (edited) => {
      const current = serviceRequestFixture({
        status: ServiceRequestStatus.Offered,
        version: 2,
        offeredAt: "2026-10-14T12:00:00.000Z",
        offeredPriceCents: 99000,
        offeredPricingMode: ServicePricingMode.Recurring,
        offeredRecurringInterval: BillingInterval.Monthly,
      });
      mocks.accept.mockResolvedValueOnce({
        ok: false,
        code: ConcurrencyErrorCode.VersionConflict,
        current,
      });
      mocks.accept.mockResolvedValueOnce({
        ok: true,
        current: { ...current, status: ServiceRequestStatus.Accepted },
      });
      const submit = renderDialog(ServiceRequestStatus.Requested);
      const price = screen.getByRole("textbox", {
        name: new RegExp(lineItemsContent.form.fields.priceCents),
      });
      if (edited) fireEvent.change(price, { target: { value: "250" } });
      fireEvent.click(
        screen.getByRole("checkbox", {
          name: content.form.withoutOfferConfirm,
        }),
      );
      fireEvent.click(submit);
      await waitFor(() =>
        expect(screen.getByText(content.form.conflict)).toBeVisible(),
      );
      expect(price).toHaveValue(edited ? "250" : "990");
      if (edited) {
        expect(submit).toBeDisabled();
        expect(
          screen.getByText(content.form.offerConflictNotice),
        ).toBeVisible();
        fireEvent.submit(
          submit.closest("form") ??
            document.getElementById(submit.getAttribute("form")!)!,
        );
        expect(mocks.accept).toHaveBeenCalledTimes(1);
        fireEvent.click(
          screen.getByRole("checkbox", {
            name: content.form.offerConflictConfirm,
          }),
        );
      }
      expect(submit).toBeEnabled();
      fireEvent.click(submit);
      await waitFor(() => expect(mocks.accept).toHaveBeenCalledTimes(2));
      expect(mocks.accept.mock.calls[1]?.[1]).toMatchObject({
        version: 2,
        acceptWithoutOffer: false,
        lineItem: {
          priceCents: edited ? 25000 : 99000,
          pricingMode: edited
            ? ServicePricingMode.OneTime
            : ServicePricingMode.Recurring,
          recurringInterval: edited ? null : BillingInterval.Monthly,
        },
      });
    },
  );

  it("preserves offered conditions when switching from an existing template back to a new one", () => {
    render(
      <ServiceRequestAcceptDialog
        request={serviceRequestFixture({
          lineItemTemplateId: null,
          status: ServiceRequestStatus.Offered,
          offeredPriceCents: 99000,
          offeredPricingMode: ServicePricingMode.Recurring,
          offeredRecurringInterval: BillingInterval.Monthly,
        })}
        viewModel={serviceRequestsViewModelFixture()}
        content={content}
        lineItemsContent={lineItemsContent}
        locale="en"
        onCloseAction={vi.fn()}
      />,
    );
    fireEvent.click(
      screen.getByRole("radio", { name: content.form.existingTemplate }),
    );
    const select = screen.getByRole("button", {
      name: new RegExp(content.form.existingTemplate),
    });
    fireEvent.click(select);
    fireEvent.click(screen.getByRole("option", { name: "Catalog service" }));
    fireEvent.click(
      screen.getByRole("radio", { name: content.form.newTemplate }),
    );
    expect(
      screen.getByRole("textbox", {
        name: new RegExp(lineItemsContent.form.fields.priceCents),
      }),
    ).toHaveValue("990");
    expect(
      screen.getByRole("button", {
        name: new RegExp(lineItemsContent.form.fields.pricingMode),
      }),
    ).toHaveTextContent(lineItemsContent.list.pricingMode.recurring);
    expect(
      screen.getByRole("button", {
        name: new RegExp(lineItemsContent.form.fields.recurringInterval),
      }),
    ).toHaveTextContent(lineItemsContent.form.interval.monthly);
  });

  it("marks and focuses an empty project selection without submitting", async () => {
    const submit = renderDialog(ServiceRequestStatus.Offered);
    const select = screen.getByRole("button", {
      name: new RegExp(content.form.existingProject),
    });
    fireEvent.click(select);
    fireEvent.click(
      screen.getByRole("option", { name: content.form.selectProject }),
    );
    fireEvent.click(submit);
    expect(screen.getByText(content.form.projectRequired)).toBeVisible();
    expect(select).toHaveAttribute("data-invalid", "true");
    expect(select).toHaveAccessibleDescription(content.form.projectRequired);
    await waitFor(() => expect(select).toHaveFocus());
    expect(mocks.accept).not.toHaveBeenCalled();
  });

  it("marks and focuses an unselected replacement template", async () => {
    const submit = renderDialog(
      ServiceRequestStatus.Offered,
      serviceRequestsViewModelFixture({
        templates: [
          {
            ...serviceRequestsViewModelFixture().templates[0]!,
            id: "55555555-5555-4555-8555-555555555555",
          },
        ],
      }),
    );
    const price = screen.getByRole("textbox", {
      name: new RegExp(lineItemsContent.form.fields.priceCents),
    });
    fireEvent.change(price, { target: { value: "990" } });
    fireEvent.click(submit);
    const select = screen.getByRole("button", {
      name: new RegExp(content.form.template),
    });
    expect(screen.getByText(content.form.templateRequired)).toBeVisible();
    expect(select).toHaveAttribute("data-invalid", "true");
    expect(select).toHaveAccessibleDescription(
      `${content.form.templateUnavailable} ${content.form.templateRequired}`,
    );
    await waitFor(() => expect(select).toHaveFocus());
    expect(mocks.accept).not.toHaveBeenCalled();
  });
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
