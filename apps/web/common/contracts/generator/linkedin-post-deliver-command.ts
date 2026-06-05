import type { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type {
  LinkedInPostDeliverFailureResponseDto,
  LinkedInPostDeliverSuccessResponseDto,
} from "./linkedin-post-deliver-response";

/** Result shape of the deliver command handler: a JSON body plus an HTTP status. */
export type LinkedInPostDeliverCommandHandlerResult = {
  body:
    | LinkedInPostDeliverSuccessResponseDto
    | LinkedInPostDeliverFailureResponseDto;
  status: HttpResponseCode;
};

/** Server-runtime input the deliver route collects for the command handler. */
export type DeliverLinkedInPostCommandInput = {
  contentLength: string | null;
  contentType: string | null;
  headers: Headers;
  requestId: string;
  readPayload: () => Promise<unknown>;
};
