import type { NextRequest } from "next/server";
import { ProjectErrorCode } from "@invessiv/common/constants/crm/errors/project-error-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { UpdateProjectRequestDto } from "@invessiv/common/contracts/crm/update-project-request.dto";
import { withCrmPermission } from "@/lib/auth/api";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { readJsonBody } from "@/lib/http/read-json-body";
import { projectApiError } from "@/lib/workspace/crm/project-api-error";
import { updateProject } from "@/server/workspace/crm/command-handler/update-project.command-handler";

type RouteContext = { params: Promise<{ projectId: string }> };
export const runtime = "nodejs";

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const { projectId } = await params;
  return withCrmPermission(
    CrmEndpointAccessRule.ProjectDetail,
    async (authorizedRequest, actor) => {
      const parsed = await readJsonBody(authorizedRequest);
      if (!parsed.ok)
        return projectApiError(ProjectErrorCode.ValidationError, {
          status: HttpResponseCode.BadRequest,
        });
      const result = await updateProject(
        projectId,
        parsed.body as UpdateProjectRequestDto,
        actor,
      );
      if (typeof result === "string") return projectApiError(result);
      if (result.ok) return Response.json({ project: result.value });
      if (result.code === ConcurrencyErrorCode.VersionConflict)
        return Response.json(result.conflict, {
          status: HttpResponseCode.Conflict,
        });
      return projectApiError(ProjectErrorCode.NotFound);
    },
  )(request);
}
