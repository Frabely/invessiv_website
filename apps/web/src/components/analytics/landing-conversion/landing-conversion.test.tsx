// @vitest-environment jsdom

import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { markLandingConversionPending } from "@/lib/analytics/google-ads-conversion/conversion-guard";
import { LandingConversion } from "./landing-conversion";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_ID", "AW-123456789");
  vi.stubEnv(
    "NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_EVENT",
    "ads_conversion_Angebot_anfordern_1",
  );
  window.gtag = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  window.sessionStorage.clear();
  delete window.gtag;
});

describe("LandingConversion", () => {
  it("fires the ads conversion once when the guard flag is present", () => {
    markLandingConversionPending("txn-1");

    render(<LandingConversion />);

    expect(window.gtag).toHaveBeenCalledTimes(1);
    expect(window.gtag).toHaveBeenCalledWith(
      "event",
      "ads_conversion_Angebot_anfordern_1",
      { transaction_id: "txn-1" },
    );
  });

  it("does not fire on a direct visit without the guard flag", () => {
    render(<LandingConversion />);

    expect(window.gtag).not.toHaveBeenCalled();
  });

  it("does not fire again after the flag was consumed (reload/back)", () => {
    markLandingConversionPending("txn-1");

    const first = render(<LandingConversion />);
    expect(window.gtag).toHaveBeenCalledTimes(1);
    first.unmount();

    render(<LandingConversion />);
    expect(window.gtag).toHaveBeenCalledTimes(1);
  });

  it("does not fire when the ads destination is not configured", () => {
    vi.unstubAllEnvs();
    markLandingConversionPending("txn-1");

    render(<LandingConversion />);

    expect(window.gtag).not.toHaveBeenCalled();
  });
});
