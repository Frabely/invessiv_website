import { beforeEach, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { PortalAuthStatus } from "@/common/constants/auth/portal-auth-statuses";
import { createPortalActor } from "./portal-actor";
import { requirePortalActor } from "./require-portal-actor";
import { PortalAuthorizationUnavailableError } from "./portal-authorization-unavailable-error.class";

vi.mock("server-only", () => ({}));

const { mockAuthenticate, mockRedirect, mockNotFound } = vi.hoisted(() => ({
  mockAuthenticate: vi.fn(),
  mockRedirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
  mockNotFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
}));

vi.mock("./portal-authentication-service", () => ({
  portalAuthenticationService: { authenticateRequest: mockAuthenticate },
}));
vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
  notFound: mockNotFound,
}));

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const ACTOR = createPortalActor({
  userId: "user-uuid-1",
  membershipId: "membership-uuid-1",
  customerId: CUSTOMER_ID,
  personId: "person-uuid-1",
  firstName: null,
  permissions: new Set([Permission.PortalAccess]),
  projectPermissions: new Map(),
});

describe("requirePortalActor", () => {
  beforeEach(() => {
    mockAuthenticate.mockReset();
    mockRedirect.mockClear();
    mockNotFound.mockClear();
  });

  it("redirects unauthenticated visitors to the locale-aware sign-in page", async () => {
    mockAuthenticate.mockResolvedValue({
      status: PortalAuthStatus.Unauthenticated,
    });

    await expect(requirePortalActor("de", CUSTOMER_ID)).rejects.toThrow(
      "REDIRECT:/de/sign-in?redirect_url=%2Fde%2Fportal",
    );
    expect(mockNotFound).not.toHaveBeenCalled();
  });

  it("answers 404 for a signed-in account without a membership for this customer", async () => {
    mockAuthenticate.mockResolvedValue({ status: PortalAuthStatus.NotMember });

    await expect(requirePortalActor("de", CUSTOMER_ID)).rejects.toThrow(
      "NOT_FOUND",
    );
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("throws instead of rendering when authorization data is unavailable", async () => {
    mockAuthenticate.mockResolvedValue({
      status: PortalAuthStatus.Unavailable,
    });

    await expect(requirePortalActor("de", CUSTOMER_ID)).rejects.toBeInstanceOf(
      PortalAuthorizationUnavailableError,
    );
  });

  it("returns the resolved actor", async () => {
    mockAuthenticate.mockResolvedValue({
      status: PortalAuthStatus.Authorized,
      actor: ACTOR,
    });

    await expect(requirePortalActor("de", CUSTOMER_ID)).resolves.toBe(ACTOR);
    expect(mockAuthenticate).toHaveBeenCalledWith(CUSTOMER_ID);
  });
});
