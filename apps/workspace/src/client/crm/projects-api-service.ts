import {
  PROJECT_ERROR_CODE_VALUES,
  ProjectErrorCode,
} from "@invessiv/common/constants/crm/errors/project-error-codes";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import type { CreateProjectRequestDto } from "@invessiv/common/contracts/crm/create-project-request.dto";
import type { ProjectDto } from "@invessiv/common/contracts/crm/project.dto";
import type { UpdateProjectRequestDto } from "@invessiv/common/contracts/crm/update-project-request.dto";
import { versionedJsonMutationService } from "@/client/shared/versioned-json-mutation-service";
import type { ProjectMutationClientResult } from "@/common/contracts/crm/project-client-results";
import {
  crmCustomerProjectsEndpoint,
  crmProjectEndpoint,
} from "@/common/patterns/crm/crm-api-endpoints";

/** Envelope key both the server response and the client result DTO use for a project. */
const PROJECT_RESULT_KEY = "project";

function isProject(value: unknown): value is ProjectDto {
  return (
    versionedJsonMutationService.isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.version === "number"
  );
}

function mutate(
  url: string,
  method: HttpMethod,
  request: CreateProjectRequestDto | UpdateProjectRequestDto,
): Promise<ProjectMutationClientResult> {
  return versionedJsonMutationService.mutateNamed(
    PROJECT_RESULT_KEY,
    url,
    method,
    request,
    (payload) =>
      versionedJsonMutationService.isRecord(payload) &&
      isProject(payload.project)
        ? payload.project
        : null,
    isProject,
    PROJECT_ERROR_CODE_VALUES,
    ProjectErrorCode.Internal,
  );
}

function createProject(
  customerId: string,
  request: CreateProjectRequestDto,
): Promise<ProjectMutationClientResult> {
  return mutate(
    crmCustomerProjectsEndpoint(customerId),
    HttpMethod.Post,
    request,
  );
}

function updateProject(
  projectId: string,
  request: UpdateProjectRequestDto,
): Promise<ProjectMutationClientResult> {
  return mutate(crmProjectEndpoint(projectId), HttpMethod.Patch, request);
}

export const projectsApiService = { createProject, updateProject } as const;
