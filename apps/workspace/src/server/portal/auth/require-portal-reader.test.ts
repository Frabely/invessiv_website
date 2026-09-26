import { beforeEach, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import { PortalAuthStatus } from "@/common/constants/auth/portal-auth-statuses";
import { createPortalOwnerView } from "./portal-owner-view";
import { PortalAuthorizationUnavailableError } from "./portal-authorization-unavailable-error.class";
import { requirePortalReader } from "./require-portal-reader";

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
  portalAuthenticationService: { authenticateReader: mockAuthenticate },
}));
vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
  notFound: mockNotFound,
}));

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const OWNER_VIEW = createPortalOwnerView({
  userId: "owner-user-uuid",
  customerId: CUSTOMER_ID,
  permissions: new Set([Permission.PortalAccess]),
});

describe("requirePortalReader", () => {
  beforeEach(() => {
    mockAuthenticate.mockReset();
    mockRedirect.mockClear();
    mockNotFound.mockClear();
  });

  it("redirects unauthenticated visitors to the locale-aware sign-in page", async () => {
    mockAuthenticate.mockResolvedValue({
      status: PortalAuthStatus.Unauthenticated,
    });

    await expect(requirePortalReader("de", CUSTOMER_ID)).rejects.toThrow(
      "REDIRECT:/de/sign-in?redirect_url=%2Fde%2Fportal",
    );
  });

  it("answers 404 for neither a member nor the owner", async () => {
    mockAuthenticate.mockResolvedValue({ status: PortalAuthStatus.NotMember });

    await expect(requirePortalReader("de", CUSTOMER_ID)).rejects.toThrow(
      "NOT_FOUND",
    );
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it("throws instead of rendering when authorization data is unavailable", async () => {
    mockAuthenticate.mockResolvedValue({
      status: PortalAuthStatus.Unavailable,
    });

    await expect(requirePortalReader("de", CUSTOMER_ID)).rejects.toBeInstanceOf(
      PortalAuthorizationUnavailableError,
    );
  });

  it("returns the resolved reader", async () => {
    mockAuthenticate.mockResolvedValue({
      status: PortalAuthStatus.Authorized,
      reader: OWNER_VIEW,
    });

    await expect(requirePortalReader("de", CUSTOMER_ID)).resolves.toBe(
      OWNER_VIEW,
    );
    expect(mockAuthenticate).toHaveBeenCalledWith(CUSTOMER_ID);
  });
});
