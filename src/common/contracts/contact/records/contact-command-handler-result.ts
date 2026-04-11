import type { ContactSubmitErrorCode } from "@/common/contracts/contact/submit/contact-submit";

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
