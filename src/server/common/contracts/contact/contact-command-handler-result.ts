import type { ContactSubmitErrorCode } from "@/features/contact/contact.contract";

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
