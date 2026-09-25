import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { MediaType } from "@invessiv/common/constants/http/media-types";
import {
  PORTAL_ACCESS_ERROR_CODE_VALUES,
  PortalAccessErrorCode,
} from "@invessiv/common/constants/crm/errors/portal-access-error-codes";
import {
  AUTH_ERROR_CODE_VALUES,
  AuthErrorCode,
} from "@invessiv/common/constants/auth/auth-error-codes";
import type { ConfirmPortalPreviewRequestDto } from "@invessiv/common/contracts/crm/confirm-portal-preview-request.dto";
import type { InvitePortalContactRequestDto } from "@invessiv/common/contracts/crm/invite-portal-contact-request.dto";
import type { ReplacePortalMembershipRolesRequestDto } from "@invessiv/common/contracts/crm/replace-portal-membership-roles-request.dto";
import { portalAccessApiEndpoints } from "@/common/patterns/crm/portal-access-api-endpoints";
import { versionedJsonMutationService } from "@/client/shared/versioned-json-mutation-service";
import type { UpdatePortalMembershipRequestDto } from "@invessiv/common/contracts/crm/update-portal-membership-request.dto";
import type { Locale } from "@/config/i18n";

type MembershipCurrent = {
  id: string;
  version: number;
  emailNotificationsEnabled: boolean;
};

const PORTAL_MEMBERSHIP_RESULT_KEY = "membership";
const PORTAL_VERSIONED_ERROR_CODES = [
  ...PORTAL_ACCESS_ERROR_CODE_VALUES,
  ...AUTH_ERROR_CODE_VALUES,
] as const;

function isMembership(value: unknown): value is MembershipCurrent {
  return (
    versionedJsonMutationService.isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.version === "number" &&
    typeof value.emailNotificationsEnabled === "boolean"
  );
}

function updateMembership(
  url: string,
  method: HttpMethod,
  request:
    ReplacePortalMembershipRolesRequestDto | UpdatePortalMembershipRequestDto,
) {
  return versionedJsonMutationService.mutateNamed(
    PORTAL_MEMBERSHIP_RESULT_KEY,
    url,
    method,
    request,
    (payload) =>
      versionedJsonMutationService.isRecord(payload) &&
      isMembership(payload.membership)
        ? payload.membership
        : null,
    isMembership,
    PORTAL_VERSIONED_ERROR_CODES,
    AuthErrorCode.Unavailable,
  );
}

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
    versionedJsonMutationService.mutate(
      portalAccessApiEndpoints.preview(customerId),
      HttpMethod.Post,
      request,
      (payload) =>
        versionedJsonMutationService.isRecord(payload) &&
        payload.ok === true &&
        typeof payload.version === "number"
          ? { version: payload.version }
          : null,
      (value): value is { version: number } =>
        versionedJsonMutationService.isRecord(value) &&
        typeof value.version === "number",
      PORTAL_VERSIONED_ERROR_CODES,
      AuthErrorCode.Unavailable,
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
    updateMembership(
      portalAccessApiEndpoints.membershipRoles(id),
      HttpMethod.Put,
      request,
    ),
  updateNotifications: (
    id: string,
    request: UpdatePortalMembershipRequestDto,
  ) =>
    updateMembership(
      portalAccessApiEndpoints.membership(id),
      HttpMethod.Patch,
      request,
    ),
  revokeMembership: (id: string) =>
    send<{ ok: boolean }>(
      portalAccessApiEndpoints.membership(id),
      HttpMethod.Delete,
    ),
  revokeInvitation: (id: string) =>
    send<null>(portalAccessApiEndpoints.invitation(id), HttpMethod.Delete),
} as const;
