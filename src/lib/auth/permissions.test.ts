import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { mockAuth, mockCurrentUser, mockRedirect, mockNotFound } = vi.hoisted(
  () => ({
    mockAuth: vi.fn(),
    mockCurrentUser: vi.fn(),
    mockRedirect: vi.fn((path: string) => {
      throw new Error(`REDIRECT:${path}`);
    }),
    mockNotFound: vi.fn(() => {
      throw new Error("NOT_FOUND");
    }),
  }),
);

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
  currentUser: mockCurrentUser,
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
  notFound: mockNotFound,
}));

import { requireDashboardAccess } from "./permissions";

const ALLOWED_EMAIL = "owner@example.com";

function buildClerkUser(options: {
  primaryEmailAddressId?: string;
  emails?: Array<{ id: string; emailAddress: string }>;
}) {
  return {
    primaryEmailAddressId: options.primaryEmailAddressId ?? "email_primary",
    emailAddresses: options.emails ?? [],
  };
}

describe("requireDashboardAccess", () => {
  beforeEach(() => {
    vi.stubEnv("DASHBOARD_ALLOWED_EMAILS", ALLOWED_EMAIL);
    mockAuth.mockReset();
    mockCurrentUser.mockReset();
    mockRedirect.mockClear();
    mockNotFound.mockClear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("redirects unauthenticated visitors to the locale-aware sign-in page", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    await expect(requireDashboardAccess("de")).rejects.toThrow(
      "REDIRECT:/de/sign-in?redirect_url=%2Fde%2Fdashboard",
    );

    expect(mockRedirect).toHaveBeenCalledWith(
      "/de/sign-in?redirect_url=%2Fde%2Fdashboard",
    );
    expect(mockCurrentUser).not.toHaveBeenCalled();
    expect(mockNotFound).not.toHaveBeenCalled();
  });

  it("uses the requested locale for the redirect target", async () => {
    mockAuth.mockResolvedValue({ userId: null });

    await expect(requireDashboardAccess("en")).rejects.toThrow(
      "REDIRECT:/en/sign-in?redirect_url=%2Fen%2Fdashboard",
    );
  });

  it("throws notFound when the authenticated user has no primary email", async () => {
    mockAuth.mockResolvedValue({ userId: "user_123" });
    mockCurrentUser.mockResolvedValue(
      buildClerkUser({
        primaryEmailAddressId: "email_primary",
        emails: [],
      }),
    );

    await expect(requireDashboardAccess("de")).rejects.toThrow("NOT_FOUND");

    expect(mockNotFound).toHaveBeenCalledTimes(1);
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("throws notFound when the primary email is not on the allowlist", async () => {
    mockAuth.mockResolvedValue({ userId: "user_123" });
    mockCurrentUser.mockResolvedValue(
      buildClerkUser({
        primaryEmailAddressId: "email_primary",
        emails: [{ id: "email_primary", emailAddress: "intruder@example.com" }],
      }),
    );

    await expect(requireDashboardAccess("de")).rejects.toThrow("NOT_FOUND");

    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });

  it("returns the access record when the primary email is allowed", async () => {
    mockAuth.mockResolvedValue({ userId: "user_123" });
    mockCurrentUser.mockResolvedValue(
      buildClerkUser({
        primaryEmailAddressId: "email_primary",
        emails: [
          { id: "email_other", emailAddress: "secondary@example.com" },
          { id: "email_primary", emailAddress: ALLOWED_EMAIL },
        ],
      }),
    );

    const access = await requireDashboardAccess("de");

    expect(access).toEqual({ userId: "user_123", email: ALLOWED_EMAIL });
    expect(mockRedirect).not.toHaveBeenCalled();
    expect(mockNotFound).not.toHaveBeenCalled();
  });

  it("matches allowlist entries regardless of casing on the Clerk side", async () => {
    mockAuth.mockResolvedValue({ userId: "user_123" });
    mockCurrentUser.mockResolvedValue(
      buildClerkUser({
        primaryEmailAddressId: "email_primary",
        emails: [{ id: "email_primary", emailAddress: "OWNER@Example.com" }],
      }),
    );

    const access = await requireDashboardAccess("en");

    expect(access).toEqual({ userId: "user_123", email: "OWNER@Example.com" });
  });
});
