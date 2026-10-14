// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import { ServiceRequestStatus as S } from "@invessiv/common/constants/crm/service-request-statuses";
import {
  serviceRequestFixture,
  serviceRequestsViewModelFixture,
} from "@/server/tests/support/service-request-fixtures";
import {
  getCrmProjectLineItemsDictionary,
  getCrmServiceRequestsDictionary,
} from "@/i18n/dictionaries/workspace/crm";
import { ServiceRequestOfferDialog } from "./service-request-offer-dialog";

const mocks = vi.hoisted(() => ({ changeStatus: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock("@/client/crm/service-requests-api-service", () => ({
  serviceRequestsApiService: { changeStatus: mocks.changeStatus },
}));
const content = getCrmServiceRequestsDictionary("en");
afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());

function renderDialog(
  request = serviceRequestFixture(),
  onCloseAction = vi.fn(),
) {
  render(
    <ServiceRequestOfferDialog
      request={request}
      viewModel={serviceRequestsViewModelFixture()}
      content={content}
      lineItemsContent={getCrmProjectLineItemsDictionary("en")}
      locale="en"
      onCloseAction={onCloseAction}
    />,
  );
  return screen.getByRole("button", { name: content.form.offer });
}

describe("ServiceRequestOfferDialog", () => {
  it("starts from the catalog price, marks it internal and records the offered price", async () => {
    const request = serviceRequestFixture();
    const close = vi.fn();
    mocks.changeStatus.mockResolvedValue({
      ok: true,
      current: { ...request, status: S.Offered, version: 2 },
    });
    const submit = renderDialog(request, close);
    const price = screen.getByRole("textbox", {
      name: new RegExp(content.form.offerPrice),
    });
    expect(price).toHaveValue("125");
    expect(screen.getByText(content.form.offerPriceHint)).toBeVisible();
    fireEvent.change(price, { target: { value: "990" } });
    fireEvent.click(submit);
    await waitFor(() => expect(close).toHaveBeenCalled());
    expect(mocks.changeStatus).toHaveBeenCalledWith(request.id, {
      to: S.Offered,
      version: 1,
      priceCents: 99000,
      pricingMode: ServicePricingMode.OneTime,
      recurringInterval: null,
      minutes: null,
    });
  });
  it("refuses an offer without a price and focuses the field", async () => {
    const submit = renderDialog(
      serviceRequestFixture({ lineItemTemplateId: null }),
    );
    fireEvent.click(submit);
    expect(
      await screen.findByText(content.form.offerPriceInvalid),
    ).toBeVisible();
    expect(
      screen.getByRole("textbox", {
        name: new RegExp(content.form.offerPrice),
      }),
    ).toHaveFocus();
    expect(mocks.changeStatus).not.toHaveBeenCalled();
  });
});
