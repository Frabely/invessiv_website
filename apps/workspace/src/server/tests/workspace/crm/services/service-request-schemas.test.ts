import { describe, expect, it } from "vitest";
import { BillingInterval } from "@invessiv/common/constants/crm/billing-intervals";
import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import { ServiceRequestStatus } from "@invessiv/common/constants/crm/service-request-statuses";
import { serviceRequestSchemas } from "@/server/workspace/crm/services/service-requests/service-request-schemas";

describe("service request offer schema", () => {
  const offer = {
    to: ServiceRequestStatus.Offered,
    version: 1,
    priceCents: 99000,
    minutes: null,
    pricingMode: ServicePricingMode.Recurring,
    recurringInterval: BillingInterval.Monthly,
  };
  it("accepts complete recurring conditions and rejects partial pricing pairs", () => {
    expect(serviceRequestSchemas.changeStatus.safeParse(offer).success).toBe(
      true,
    );
    expect(
      serviceRequestSchemas.changeStatus.safeParse({
        ...offer,
        recurringInterval: null,
      }).success,
    ).toBe(false);
    expect(
      serviceRequestSchemas.changeStatus.safeParse({
        ...offer,
        pricingMode: ServicePricingMode.OneTime,
      }).success,
    ).toBe(false);
    expect(
      serviceRequestSchemas.changeStatus.safeParse({
        ...offer,
        pricingMode: undefined,
        recurringInterval: undefined,
      }).success,
    ).toBe(false);
  });
});
