import "server-only";

import type { NextRequest } from "next/server";

import { FeedbackRoundErrorCode } from "@invessiv/common/constants/crm/errors/feedback-round-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { HandOverFeedbackRoundRequestDto } from "@invessiv/common/contracts/crm/hand-over-feedback-round-request.dto";
import type { HandOverFeedbackRoundResult } from "@invessiv/common/contracts/crm/results/hand-over-feedback-round-result";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { CrmOperation } from "@/common/constants/crm/crm-operations";
import { withCrmPermission } from "@/lib/auth/api";
import { readJsonBody } from "@/lib/http/read-json-body";
import {
  feedbackRoundApiError,
  privateFeedbackRoundResponse,
} from "@/lib/workspace/crm/feedback-round-api-error";
import { handOverFeedbackRound } from "@/server/workspace/crm/command-handler/hand-over-feedback-round.command-handler";
import { listProjectFeedbackRounds } from "@/server/workspace/crm/query-handler/list-project-feedback-rounds.query-handler";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ projectId: string }> };

function handOverResponse(result: HandOverFeedbackRoundResult): Response {
  if (result.ok)
    return Response.json(
      { round: result.round },
      { status: HttpResponseCode.Created },
    );
  if (result.code === FeedbackRoundErrorCode.RoundAlreadyActive)
    return feedbackRoundApiError(result.code, {
      activeRound: result.activeRound,
    });
  if (result.code === FeedbackRoundErrorCode.ValidationError)
    return feedbackRoundApiError(result.code, { details: result.errors });
  return feedbackRoundApiError(result.code);
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { projectId } = await params;
  return privateFeedbackRoundResponse(CrmOperation.ListFeedbackRounds, () =>
    withCrmPermission(
      CrmEndpointAccessRule.FeedbackRounds,
      async (_, actor) => {
        const rounds = await listProjectFeedbackRounds(projectId, actor);
        return rounds
          ? Response.json(rounds, { status: HttpResponseCode.Ok })
          : feedbackRoundApiError(FeedbackRoundErrorCode.ProjectNotFound);
      },
    )(request),
  );
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { projectId } = await params;
  return privateFeedbackRoundResponse(CrmOperation.HandOverFeedbackRound, () =>
    withCrmPermission(
      CrmEndpointAccessRule.FeedbackRoundHandOver,
      async (authorizedRequest, actor) => {
        const parsed = await readJsonBody(authorizedRequest);
        if (!parsed.ok)
          return feedbackRoundApiError(FeedbackRoundErrorCode.ValidationError);
        // The command validates the body against its schema before using it.
        return handOverResponse(
          await handOverFeedbackRound(
            projectId,
            parsed.body as HandOverFeedbackRoundRequestDto,
            actor,
          ),
        );
      },
    )(request),
  );
}
