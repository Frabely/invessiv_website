import { AuthErrorCode } from "@invessiv/common/constants/auth/auth-error-codes";
import { PortalAccessErrorCode } from "@invessiv/common/constants/crm/errors/portal-access-error-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { CrmPortalAccessDictionary } from "@/i18n/dictionaries/workspace/crm";

export function portalAccessErrorMessage(
  code: string,
  content: CrmPortalAccessDictionary,
): string {
  const errors = content.errors;
  switch (code) {
    case PortalAccessErrorCode.CustomerNotFound:
    case PortalAccessErrorCode.NotFound:
    case AuthErrorCode.NotFound:
      return errors.notFound;
    case PortalAccessErrorCode.AssignmentNotFound:
      return errors.assignmentMissing;
    case PortalAccessErrorCode.PreviewNotConfirmed:
      return errors.preview;
    case PortalAccessErrorCode.MembershipAlreadyActive:
      return errors.alreadyActive;
    case PortalAccessErrorCode.InvalidPortalRole:
      return errors.invalidRole;
    case PortalAccessErrorCode.InvalidRoles:
      return errors.roles;
    case PortalAccessErrorCode.ValidationError:
      return errors.validation;
    case ConcurrencyErrorCode.VersionConflict:
      return errors.conflict;
    case AuthErrorCode.Forbidden:
      return errors.forbidden;
    case AuthErrorCode.Unauthorized:
      return errors.sessionExpired;
    case AuthErrorCode.Unavailable:
    case PortalAccessErrorCode.Unavailable:
      return errors.unavailable;
    default:
      return errors.generic;
  }
}
