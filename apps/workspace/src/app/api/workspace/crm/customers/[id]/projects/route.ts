import type { NextRequest } from "next/server";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { ProjectErrorCode } from "@invessiv/common/constants/crm/errors/project-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { CreateProjectRequestDto } from "@invessiv/common/contracts/crm/create-project-request.dto";
import { withCrmPermission } from "@/lib/auth/api";
import { canOn } from "@/common/patterns/auth/can-on";
import { CrmEndpointAccessRule } from "@/common/constants/auth/crm-endpoint-access-rules";
import { readJsonBody } from "@/lib/http/read-json-body";
import { projectApiError } from "@/lib/workspace/crm/project-api-error";
import { createProject } from "@/server/workspace/crm/command-handler/create-project.command-handler";
import { listProjectsByCustomer } from "@/server/workspace/crm/query-handler/list-projects-by-customer.query-handler";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  return withCrmPermission(
    CrmEndpointAccessRule.CustomerProjects,
    async (_, actor) => {
      const projects = await listProjectsByCustomer(id, actor);
      if (
        projects.length === 0 &&
        !canOn(actor, Permission.ProjectsRead, { customerId: id })
      ) {
        return projectApiError(ProjectErrorCode.NotFound);
      }

      return Response.json({ projects });
    },
  )(request);
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  return withCrmPermission(
    CrmEndpointAccessRule.ProjectCreate,
    async (authorizedRequest, actor) => {
      const parsed = await readJsonBody(authorizedRequest);
      if (!parsed.ok) {
        return projectApiError(ProjectErrorCode.ValidationError, {
          status: HttpResponseCode.BadRequest,
        });
      }
      const project = await createProject(
        id,
        parsed.body as CreateProjectRequestDto,
        actor,
      );
      if (typeof project === "string") return projectApiError(project);
      return Response.json({ project }, { status: HttpResponseCode.Created });
    },
  )(request);
}
