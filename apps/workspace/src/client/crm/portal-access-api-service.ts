import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { MediaType } from "@invessiv/common/constants/http/media-types";
import { PortalAccessErrorCode } from "@invessiv/common/constants/crm/errors/portal-access-error-codes";
import type { ConfirmPortalPreviewRequestDto } from "@invessiv/common/contracts/crm/confirm-portal-preview-request.dto";
import type { InvitePortalContactRequestDto } from "@invessiv/common/contracts/crm/invite-portal-contact-request.dto";
import type { ReplacePortalMembershipRolesRequestDto } from "@invessiv/common/contracts/crm/replace-portal-membership-roles-request.dto";
import { portalAccessApiEndpoints } from "@/common/patterns/crm/portal-access-api-endpoints";
import type { Locale } from "@/config/i18n";

type MembershipCurrent = {
  id: string;
  version: number;
  emailNotificationsEnabled: boolean;
};

type ApiResult<T, TCurrent = MembershipCurrent> =
  | { ok: true; value: T }
  | {
      ok: false;
      code: string;
      current?: TCurrent;
    };

type ApiFailure<TCurrent> = Extract<
  ApiResult<unknown, TCurrent>,
  { ok: false }
>;

function toApiFailure<TCurrent>(
  response: Response,
  payload: unknown,
): ApiFailure<TCurrent> {
  if (typeof payload !== "object" || payload === null) {
    if (response.status === HttpResponseCode.NotFound)
      return { ok: false, code: PortalAccessErrorCode.NotFound };
    return { ok: false, code: PortalAccessErrorCode.Unavailable };
  }

  const record = payload as Record<string, unknown>;
  const code =
    typeof record.code === "string"
      ? record.code
      : typeof record.error === "string"
        ? record.error
        : PortalAccessErrorCode.Unavailable;
  const current = record.current;
  if (
    response.status === HttpResponseCode.Conflict &&
    typeof current === "object" &&
    current !== null
  ) {
    return { ok: false, code, current: current as TCurrent };
  }
  return { ok: false, code };
}

async function send<T, TCurrent = MembershipCurrent>(
  url: string,
  method: HttpMethod,
  body?: unknown,
): Promise<ApiResult<T, TCurrent>> {
  try {
    const response = await fetch(url, {
      method,
      ...(body === undefined
        ? {}
        : {
            headers: { [HttpHeaderName.ContentType]: MediaType.Json },
            body: JSON.stringify(body),
          }),
    });
    const payload: unknown = await response.json().catch(() => null);
    if (response.ok) return { ok: true, value: payload as T };
    return toApiFailure<TCurrent>(response, payload);
  } catch {
    return { ok: false, code: PortalAccessErrorCode.Unavailable };
  }
}

export const portalAccessApiService = {
  confirmPreview: (
    customerId: string,
    request: ConfirmPortalPreviewRequestDto,
  ) =>
    send<{ version: number }, { version: number }>(
      portalAccessApiEndpoints.preview(customerId),
      HttpMethod.Post,
      request,
    ),
  invite: (
    customerId: string,
    locale: Locale,
    request: InvitePortalContactRequestDto,
  ) =>
    send<{ invitation: { id: string; expiresAt: string }; inviteUrl: string }>(
      portalAccessApiEndpoints.invite(customerId, locale),
      HttpMethod.Post,
      request,
    ),
  replaceRoles: (id: string, request: ReplacePortalMembershipRolesRequestDto) =>
    send<{
      membership: {
        id: string;
        version: number;
        emailNotificationsEnabled: boolean;
      };
    }>(portalAccessApiEndpoints.membershipRoles(id), HttpMethod.Put, request),
  revokeMembership: (id: string) =>
    send<{ ok: boolean }>(
      portalAccessApiEndpoints.membership(id),
      HttpMethod.Delete,
    ),
  revokeInvitation: (id: string) =>
    send<null>(portalAccessApiEndpoints.invitation(id), HttpMethod.Delete),
} as const;
