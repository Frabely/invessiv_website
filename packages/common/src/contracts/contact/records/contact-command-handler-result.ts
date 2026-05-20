import type { ContactSubmitErrorCode } from "@invessiv/common/contracts/contact/submit/contact-submit-error-code";

export type ContactCommandHandlerSuccessResult = {
  ok: true;
};

export type ContactCommandHandlerErrorResult = {
  code: ContactSubmitErrorCode;
  fieldErrors?: Record<string, string[]>;
  ok: false;
};

export type ContactCommandHandlerResult =
  | ContactCommandHandlerSuccessResult
  | ContactCommandHandlerErrorResult;
