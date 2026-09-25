import { afterEach, describe, expect, it, vi } from "vitest";
import { WorkspaceApiEndpoint } from "@/common/constants/api-endpoints";
import { PortalInvitationErrorCode } from "@invessiv/common/constants/portal/portal-invitation-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { portalInvitationApiService } from "./portal-invitation-api-service";

afterEach(() => vi.unstubAllGlobals());

describe("portalInvitationApiService", () => {
  it("returns the customer id after a successful redemption", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, customerId: "customer-id" }), {
        status: HttpResponseCode.Ok,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      portalInvitationApiService.redeem("invite-token"),
    ).resolves.toEqual({
      ok: true,
      customerId: "customer-id",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      WorkspaceApiEndpoint.PortalInvitationRedeem,
      expect.objectContaining({
        body: JSON.stringify({ token: "invite-token" }),
      }),
    );
  });

  it("distinguishes unavailable responses from invalid invitations", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response("{}", { status: HttpResponseCode.NotFound }),
      )
      .mockResolvedValueOnce(
        new Response("{}", { status: HttpResponseCode.ServiceUnavailable }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(portalInvitationApiService.redeem("invalid")).resolves.toEqual(
      {
        ok: false,
        code: PortalInvitationErrorCode.Invalid,
      },
    );
    await expect(
      portalInvitationApiService.redeem("unavailable"),
    ).resolves.toEqual({
      ok: false,
      code: PortalInvitationErrorCode.Unavailable,
    });
  });
});
