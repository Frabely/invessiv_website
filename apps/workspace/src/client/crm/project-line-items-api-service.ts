import {
  PROJECT_LINE_ITEM_ERROR_CODE_VALUES,
  ProjectLineItemErrorCode,
} from "@invessiv/common/constants/crm/errors/project-line-item-error-codes";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import type { CreateProjectLineItemRequestDto } from "@invessiv/common/contracts/crm/create-project-line-item-request.dto";
import type { ProjectLineItemDto } from "@invessiv/common/contracts/crm/project-line-item.dto";
import type { UpdateProjectLineItemRequestDto } from "@invessiv/common/contracts/crm/update-project-line-item-request.dto";
import { versionedJsonMutationService } from "@/client/shared/versioned-json-mutation-service";
import type { ProjectLineItemMutationClientResult } from "@/common/contracts/crm/project-line-item-client-results";
import {
  crmProjectLineItemEndpoint,
  crmProjectLineItemsEndpoint,
} from "@/common/patterns/crm/crm-api-endpoints";

/** Envelope key both the server response and the client result DTO use for a project line item. */
const PROJECT_LINE_ITEM_RESULT_KEY = "projectLineItem";

function isProjectLineItem(value: unknown): value is ProjectLineItemDto {
  return (
    versionedJsonMutationService.isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.version === "number"
  );
}

function mutate(
  url: string,
  method: HttpMethod,
  body: unknown,
): Promise<ProjectLineItemMutationClientResult> {
  return versionedJsonMutationService.mutateNamed(
    PROJECT_LINE_ITEM_RESULT_KEY,
    url,
    method,
    body,
    (payload) =>
      versionedJsonMutationService.isRecord(payload) &&
      isProjectLineItem(payload.projectLineItem)
        ? payload.projectLineItem
        : null,
    isProjectLineItem,
    PROJECT_LINE_ITEM_ERROR_CODE_VALUES,
    ProjectLineItemErrorCode.Internal,
  );
}

function createProjectLineItem(
  projectId: string,
  request: CreateProjectLineItemRequestDto,
): Promise<ProjectLineItemMutationClientResult> {
  return mutate(
    crmProjectLineItemsEndpoint(projectId),
    HttpMethod.Post,
    request,
  );
}

function updateProjectLineItem(
  projectLineItemId: string,
  request: UpdateProjectLineItemRequestDto,
): Promise<ProjectLineItemMutationClientResult> {
  return mutate(
    crmProjectLineItemEndpoint(projectLineItemId),
    HttpMethod.Patch,
    request,
  );
}

export const projectLineItemsApiService = {
  createProjectLineItem,
  updateProjectLineItem,
} as const;
