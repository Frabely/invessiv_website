import type { ContactSubmitErrorCode } from "./contact-submit-error-code";

export type ContactSubmitSuccessResponse = {
  ok: true;
  requestId: string;
};

export type ContactSubmitErrorResponse = {
  code: ContactSubmitErrorCode;
  fieldErrors?: Record<string, string[]>;
  ok: false;
  requestId: string;
};

export type ContactSubmitResponse =
  | ContactSubmitSuccessResponse
  | ContactSubmitErrorResponse;
