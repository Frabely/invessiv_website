// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";
import { LANDING_CONVERSION_GUARD_KEY } from "@/common/constants/storage/storage-keys";
import {
  consumeLandingConversionGuard,
  createConversionTransactionId,
  markLandingConversionPending,
} from "./conversion-guard";

afterEach(() => {
  window.sessionStorage.clear();
});

describe("createConversionTransactionId", () => {
  it("returns a non-empty, unique id on each call", () => {
    const first = createConversionTransactionId();
    const second = createConversionTransactionId();

    expect(first.length).toBeGreaterThan(0);
    expect(second.length).toBeGreaterThan(0);
    expect(first).not.toBe(second);
  });
});

describe("markLandingConversionPending / consumeLandingConversionGuard", () => {
  it("stores the transaction id and reads it back exactly once", () => {
    markLandingConversionPending("txn-1");
    expect(window.sessionStorage.getItem(LANDING_CONVERSION_GUARD_KEY)).toBe(
      "txn-1",
    );

    expect(consumeLandingConversionGuard()).toBe("txn-1");
  });

  it("deletes the flag on read so a second consume returns null (no double-fire)", () => {
    markLandingConversionPending("txn-2");

    expect(consumeLandingConversionGuard()).toBe("txn-2");
    expect(consumeLandingConversionGuard()).toBeNull();
    expect(
      window.sessionStorage.getItem(LANDING_CONVERSION_GUARD_KEY),
    ).toBeNull();
  });

  it("returns null when no flag was set (direct visit)", () => {
    expect(consumeLandingConversionGuard()).toBeNull();
  });
});
