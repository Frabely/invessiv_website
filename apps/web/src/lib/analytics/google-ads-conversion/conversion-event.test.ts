// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildConversionSendTo,
  fireLandingConversion,
} from "./conversion-event";

afterEach(() => {
  delete window.gtag;
});

describe("buildConversionSendTo", () => {
  it("joins conversion id and label with a slash", () => {
    expect(buildConversionSendTo("AW-123456789", "abcDEF")).toBe(
      "AW-123456789/abcDEF",
    );
  });
});

describe("fireLandingConversion", () => {
  it("emits the conversion event with send_to and transaction_id", () => {
    window.gtag = vi.fn();

    const fired = fireLandingConversion({
      adsConversionId: "AW-123456789",
      adsConversionLabel: "abcDEF",
      transactionId: "txn-1",
    });

    expect(fired).toBe(true);
    expect(window.gtag).toHaveBeenCalledWith("event", "conversion", {
      send_to: "AW-123456789/abcDEF",
      transaction_id: "txn-1",
    });
  });

  it("no-ops when the ads destination is not configured", () => {
    window.gtag = vi.fn();

    expect(
      fireLandingConversion({
        adsConversionId: null,
        adsConversionLabel: "abcDEF",
        transactionId: "txn-1",
      }),
    ).toBe(false);
    expect(
      fireLandingConversion({
        adsConversionId: "AW-123456789",
        adsConversionLabel: null,
        transactionId: "txn-1",
      }),
    ).toBe(false);
    expect(window.gtag).not.toHaveBeenCalled();
  });

  it("no-ops when gtag is not available yet", () => {
    expect(
      fireLandingConversion({
        adsConversionId: "AW-123456789",
        adsConversionLabel: "abcDEF",
        transactionId: "txn-1",
      }),
    ).toBe(false);
  });
});
