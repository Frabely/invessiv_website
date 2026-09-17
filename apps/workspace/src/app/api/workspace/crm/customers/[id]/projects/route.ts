import type { NextRequest } from "next/server";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { ProjectErrorCode } from "@invessiv/common/constants/crm/errors/project-error-codes";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import type { CreateProjectRequestDto } from "@invessiv/common/contracts/crm/create-project-request.dto";
import { withPermission } from "@/lib/auth/api";
import { readJsonBody } from "@/lib/http/read-json-body";
import { projectApiError } from "@/lib/workspace/crm/project-api-error";
import { createProject } from "@/server/workspace/crm/command-handler/create-project.command-handler";
import { listProjectsByCustomer } from "@/server/workspace/crm/query-handler/list-projects-by-customer.query-handler";

export const runtime = "nodejs";
type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  return withPermission(Permission.ProjectsRead, async () =>
    Response.json({ projects: await listProjectsByCustomer(id) }),
  )(request);
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  return withPermission(Permission.ProjectsWrite, async (authorizedRequest) => {
    const parsed = await readJsonBody(authorizedRequest);
    if (!parsed.ok) {
      return projectApiError(ProjectErrorCode.ValidationError, {
        status: HttpResponseCode.BadRequest,
      });
    }
    const project = await createProject(
      id,
      parsed.body as CreateProjectRequestDto,
    );
    return project
      ? Response.json({ project }, { status: HttpResponseCode.Created })
      : projectApiError(ProjectErrorCode.ValidationError);
  })(request);
}
