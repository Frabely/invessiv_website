import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { isEmailAllowed, parseAllowedEmails } from "./allowlist";

describe("parseAllowedEmails", () => {
  it("returns an empty set when raw is undefined", () => {
    expect(parseAllowedEmails(undefined).size).toBe(0);
  });

  it("returns an empty set for empty or whitespace-only values", () => {
    expect(parseAllowedEmails("").size).toBe(0);
    expect(parseAllowedEmails("   ").size).toBe(0);
    expect(parseAllowedEmails(",, ,, ").size).toBe(0);
  });

  it("trims whitespace and lowercases each entry", () => {
    const allowed = parseAllowedEmails(
      "  Owner@Example.com , second@INVESSIV.com ",
    );

    expect(allowed.has("owner@example.com")).toBe(true);
    expect(allowed.has("second@invessiv.com")).toBe(true);
    expect(allowed.size).toBe(2);
  });

  it("collapses duplicate entries with different casing or padding", () => {
    const allowed = parseAllowedEmails("foo@bar.com, FOO@bar.com ,foo@BAR.com");

    expect(allowed.size).toBe(1);
    expect(allowed.has("foo@bar.com")).toBe(true);
  });

  it("ignores empty fragments between commas", () => {
    const allowed = parseAllowedEmails("a@b.com,,c@d.com,");

    expect(allowed.size).toBe(2);
    expect(allowed.has("a@b.com")).toBe(true);
    expect(allowed.has("c@d.com")).toBe(true);
  });
});

describe("isEmailAllowed", () => {
  beforeEach(() => {
    vi.stubEnv(
      "DASHBOARD_ALLOWED_EMAILS",
      "owner@example.com, Second@Invessiv.com",
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns false for falsy inputs", () => {
    expect(isEmailAllowed(undefined)).toBe(false);
    expect(isEmailAllowed(null)).toBe(false);
    expect(isEmailAllowed("")).toBe(false);
  });

  it("matches allowed addresses regardless of casing or padding", () => {
    expect(isEmailAllowed("owner@example.com")).toBe(true);
    expect(isEmailAllowed(" Owner@Example.com ")).toBe(true);
    expect(isEmailAllowed("SECOND@invessiv.com")).toBe(true);
  });

  it("returns false for addresses outside the allowlist", () => {
    expect(isEmailAllowed("intruder@example.com")).toBe(false);
    expect(isEmailAllowed("owner@evil.com")).toBe(false);
  });

  it("re-reads the ENV value when it changes between calls", () => {
    expect(isEmailAllowed("owner@example.com")).toBe(true);

    vi.stubEnv("DASHBOARD_ALLOWED_EMAILS", "different@example.com");

    expect(isEmailAllowed("owner@example.com")).toBe(false);
    expect(isEmailAllowed("different@example.com")).toBe(true);
  });

  it("denies access when the ENV is empty", () => {
    vi.stubEnv("DASHBOARD_ALLOWED_EMAILS", "");

    expect(isEmailAllowed("owner@example.com")).toBe(false);
  });
});
