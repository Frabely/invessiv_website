import type { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";

export type ApiErrorDefinition = { status: HttpResponseCode; message: string };
