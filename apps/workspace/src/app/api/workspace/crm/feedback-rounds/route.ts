import "server-only";

import type { NextRequest } from "next/server";

import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { readFeedbackInboxFilters } from "@/common/patterns/crm/feedback-inbox-query";
import { withCrmPermission } from "@/lib/auth/api";
import { privateFeedbackRoundResponse } from "@/lib/workspace/crm/feedback-round-api-error";
import { listFeedbackInbox } from "@/server/workspace/crm/query-handler/list-feedback-inbox.query-handler";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return privateFeedbackRoundResponse(CrmOperation.ListFeedbackInbox, () =>
    withCrmPermission(CrmEndpointAccessRule.FeedbackInbox, async (_, actor) => {
      const filters = readFeedbackInboxFilters(
        Object.fromEntries(request.nextUrl.searchParams),
      );
      return Response.json(await listFeedbackInbox(filters, actor), {
        status: HttpResponseCode.Ok,
      });
    })(request),
  );
}
