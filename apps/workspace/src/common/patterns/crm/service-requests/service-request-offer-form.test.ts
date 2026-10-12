import { describe, expect, it } from "vitest";
import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import { ServiceRequestStatus } from "@invessiv/common/constants/crm/service-request-statuses";
import {
  serviceRequestFixture,
  serviceRequestTemplateFixture,
} from "@/server/tests/support/service-request-fixtures";
import {
  createServiceRequestOfferForm,
  isServiceRequestOfferPriceValid,
  toOfferServiceRequest,
} from "./service-request-offer-form";

describe("service request offer form", () => {
  it("starts from the catalog price and sends the offered price with the current version", () => {
    const request = serviceRequestFixture({ version: 3 });
    const values = createServiceRequestOfferForm(
      request,
      [serviceRequestTemplateFixture()],
      "de",
    );
    expect(values).toEqual({ priceInput: "125", quantityInput: "" });
    expect(toOfferServiceRequest(values, request)).toEqual({
      to: ServiceRequestStatus.Offered,
      version: 3,
      priceCents: 12500,
      minutes: null,
    });
  });
  it("leaves the price of a free-text request empty and refuses to send without one", () => {
    const request = serviceRequestFixture({ lineItemTemplateId: null });
    const values = createServiceRequestOfferForm(request, [], "de");
    expect(values.priceInput).toBe("");
    expect(isServiceRequestOfferPriceValid(values)).toBe(false);
    expect(toOfferServiceRequest(values, request)).toBeNull();
  });
  it("offers hours with a rate and a quantity, prefilled with the requested hours", () => {
    const request = serviceRequestFixture({
      kind: LineItemKind.Hours,
      requestedMinutes: 300,
    });
    const values = {
      ...createServiceRequestOfferForm(request, [], "de"),
      priceInput: "110",
    };
    expect(values.quantityInput).toBe("5:00");
    expect(toOfferServiceRequest(values, request)).toMatchObject({
      priceCents: 11000,
      minutes: 300,
    });
    expect(
      toOfferServiceRequest({ ...values, quantityInput: "" }, request),
    ).toBeNull();
  });
});
