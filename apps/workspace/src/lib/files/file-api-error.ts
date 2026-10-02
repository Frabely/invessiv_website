import "server-only";
import { FileApiErrorCode as E } from "@invessiv/common/constants/files/file-api-error-code";
import { FileErrorCode } from "@invessiv/common/constants/files/file-error-code";
import { HttpResponseCode as H } from "@invessiv/common/constants/http/http-response-codes";

const STATUS_BY_CODE: Partial<Record<E | FileErrorCode, H>> = {
  [E.NotFound]: H.NotFound,
  [E.PendingLimit]: H.TooManyRequests,
  [E.FeedbackBound]: H.Conflict,
  [E.OnboardingBound]: H.Conflict,
  [E.StorageUnavailable]: H.ServiceUnavailable,
  [E.Internal]: H.InternalServerError,
  [FileErrorCode.TooLarge]: H.PayloadTooLarge,
};

const MESSAGES: Record<E | FileErrorCode, string> = {
  [E.NotFound]: "File or target not found.",
  [E.Validation]: "Invalid file request.",
  [E.ArchiveLimit]: "Archive file count or size limit exceeded.",
  [E.ArchiveVideo]: "Videos must be downloaded individually.",
  [E.PendingLimit]: "Too many pending uploads.",
  [E.CustomerVisibility]: "Customer uploads must remain visible.",
  [E.FeedbackBound]: "This file belongs to submitted feedback.",
  [E.OnboardingBound]: "This file is attached to an onboarding form.",
  [E.UploadOwner]: "Only the uploader can complete this upload.",
  [E.NotUpload]: "This entry is not an upload.",
  [E.StorageUnavailable]: "File storage is temporarily unavailable.",
  [E.Internal]: "The file request failed.",
  [FileErrorCode.UnsupportedExtension]: "Unsupported file extension.",
  [FileErrorCode.InvalidSize]: "Invalid file size.",
  [FileErrorCode.TooLarge]: "File is too large.",
  [FileErrorCode.TooManyFiles]: "Too many files.",
  [FileErrorCode.BatchTooLarge]: "Upload batch is too large.",
  [FileErrorCode.MissingObject]: "Uploaded object not found.",
  [FileErrorCode.SizeMismatch]: "Uploaded size does not match.",
  [FileErrorCode.ContentTypeMismatch]: "Uploaded content type does not match.",
  [FileErrorCode.InvalidSignature]: "Invalid file signature.",
  [FileErrorCode.UnsafeSvg]: "Unsafe SVG content.",
  [FileErrorCode.InvalidOffice]: "Invalid Office document.",
  [FileErrorCode.InvalidLink]: "Invalid HTTPS link.",
};

export function fileErrorResponse(
  code: E | FileErrorCode,
  status: H = STATUS_BY_CODE[code] ?? H.UnprocessableContent,
): Response {
  return Response.json({ code, message: MESSAGES[code] }, { status });
}
