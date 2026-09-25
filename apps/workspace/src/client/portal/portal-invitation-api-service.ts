import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { MediaType } from "@invessiv/common/constants/http/media-types";
import { WorkspaceApiEndpoint } from "@/common/constants/api-endpoints";
import { PortalInvitationErrorCode } from "@invessiv/common/constants/portal/portal-invitation-error-codes";

type RedeemResult =
  | { ok: true; customerId: string }
  | { ok: false; code: PortalInvitationErrorCode };

async function redeem(token: string): Promise<RedeemResult> {
  try {
    const response = await fetch(WorkspaceApiEndpoint.PortalInvitationRedeem, {
      method: HttpMethod.Post,
      headers: { [HttpHeaderName.ContentType]: MediaType.Json },
      body: JSON.stringify({ token }),
    });
    const payload: unknown = await response.json().catch(() => null);
    if (
      response.ok &&
      typeof payload === "object" &&
      payload !== null &&
      "customerId" in payload &&
      typeof payload.customerId === "string"
    ) {
      return { ok: true, customerId: payload.customerId };
    }
    if (typeof payload === "object" && payload !== null && "code" in payload) {
      const code = payload.code;
      if (
        Object.values(PortalInvitationErrorCode).some((value) => value === code)
      )
        return { ok: false, code: code as PortalInvitationErrorCode };
    }
    return {
      ok: false,
      code:
        response.status === HttpResponseCode.ServiceUnavailable
          ? PortalInvitationErrorCode.Unavailable
          : PortalInvitationErrorCode.Invalid,
    };
  } catch {
    return { ok: false, code: PortalInvitationErrorCode.Unavailable };
  }
}

export const portalInvitationApiService = { redeem } as const;
