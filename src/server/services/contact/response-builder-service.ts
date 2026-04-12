import { NextResponse } from "next/server";
import type {
  ContactSubmitErrorCode,
  ContactSubmitErrorResponse,
  ContactSubmitSuccessResponse,
} from "@/common/contracts/contact/submit/contact-submit";

export function createContactSuccessResponse(requestId: string, status = 200) {
  const body: ContactSubmitSuccessResponse = {
    ok: true,
    requestId,
  };

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "no-store",
    },
    status,
  });
}

export function createContactErrorResponse(
  code: ContactSubmitErrorCode,
  requestId: string,
  status: number,
  fieldErrors?: Record<string, string[]>,
  headers?: HeadersInit,
) {
  const body: ContactSubmitErrorResponse = {
    code,
    fieldErrors,
    ok: false,
    requestId,
  };

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "no-store",
      ...headers,
    },
    status,
  });
}
