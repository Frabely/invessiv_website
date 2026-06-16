// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { fireLandingConversion } from "./conversion-event";

afterEach(() => {
  delete window.gtag;
});

describe("fireLandingConversion", () => {
  it("emits the configured ads conversion event with transaction_id", () => {
    window.gtag = vi.fn();

    const fired = fireLandingConversion({
      adsConversionId: "AW-123456789",
      adsConversionEvent: "ads_conversion_Angebot_anfordern_1",
      transactionId: "txn-1",
    });

    expect(fired).toBe(true);
    expect(window.gtag).toHaveBeenCalledWith(
      "event",
      "ads_conversion_Angebot_anfordern_1",
      { transaction_id: "txn-1" },
    );
  });

  it("no-ops when the ads destination or event is not configured", () => {
    window.gtag = vi.fn();

    expect(
      fireLandingConversion({
        adsConversionId: null,
        adsConversionEvent: "ads_conversion_Angebot_anfordern_1",
        transactionId: "txn-1",
      }),
    ).toBe(false);
    expect(
      fireLandingConversion({
        adsConversionId: "AW-123456789",
        adsConversionEvent: null,
        transactionId: "txn-1",
      }),
    ).toBe(false);
    expect(window.gtag).not.toHaveBeenCalled();
  });

  it("no-ops when gtag is not available yet", () => {
    expect(
      fireLandingConversion({
        adsConversionId: "AW-123456789",
        adsConversionEvent: "ads_conversion_Angebot_anfordern_1",
        transactionId: "txn-1",
      }),
    ).toBe(false);
  });
});
