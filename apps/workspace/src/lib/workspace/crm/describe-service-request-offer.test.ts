import { describe, expect, it } from "vitest";
import { BillingInterval } from "@invessiv/common/constants/crm/billing-intervals";
import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import { serviceRequestFixture } from "@/server/tests/support/service-request-fixtures";
import {
  getCrmProjectLineItemsDictionary,
  getCrmServiceRequestsDictionary,
} from "@/i18n/dictionaries/workspace/crm";
import { describeServiceRequestOffer } from "./describe-service-request-offer";

describe("describeServiceRequestOffer", () => {
  it.each(["de", "en"] as const)(
    "shows the captured monthly interval in %s",
    (locale) => {
      const request = serviceRequestFixture({
        offeredAt: "2026-10-13T08:00:00.000Z",
        offeredPriceCents: 99000,
        offeredPricingMode: ServicePricingMode.Recurring,
        offeredRecurringInterval: BillingInterval.Monthly,
      });
      const text = describeServiceRequestOffer(
        request,
        getCrmServiceRequestsDictionary(locale),
        locale,
      );
      expect(text).toContain(
        getCrmProjectLineItemsDictionary(locale).form.interval.monthly,
      );
      expect(text).toContain("990");
    },
  );
  it("shows the pricing mode for a standard rate offer", () => {
    const request = serviceRequestFixture({
      offeredAt: "2026-10-13T08:00:00.000Z",
      offeredPriceCents: 12500,
      offeredPricingMode: ServicePricingMode.Rate,
    });
    expect(
      describeServiceRequestOffer(
        request,
        getCrmServiceRequestsDictionary("en"),
        "en",
      ),
    ).toContain(getCrmProjectLineItemsDictionary("en").list.pricingMode.rate);
  });
});
