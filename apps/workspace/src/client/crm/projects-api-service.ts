import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { MediaType } from "@invessiv/common/constants/http/media-types";
import type { CreateProjectRequestDto } from "@invessiv/common/contracts/crm/create-project-request.dto";
import type { UpdateProjectRequestDto } from "@invessiv/common/contracts/crm/update-project-request.dto";
import {
  crmCustomerProjectsEndpoint,
  crmProjectEndpoint,
} from "@/common/patterns/crm/crm-api-endpoints";

async function mutate(
  url: string,
  method: HttpMethod,
  request: CreateProjectRequestDto | UpdateProjectRequestDto,
): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method,
      headers: { [HttpHeaderName.ContentType]: MediaType.Json },
      body: JSON.stringify(request),
    });
    return response.ok;
  } catch {
    return false;
  }
}

function createProject(
  customerId: string,
  request: CreateProjectRequestDto,
): Promise<boolean> {
  return mutate(
    crmCustomerProjectsEndpoint(customerId),
    HttpMethod.Post,
    request,
  );
}

function updateProject(
  projectId: string,
  request: UpdateProjectRequestDto,
): Promise<boolean> {
  return mutate(crmProjectEndpoint(projectId), HttpMethod.Patch, request);
}

export const projectsApiService = { createProject, updateProject } as const;
