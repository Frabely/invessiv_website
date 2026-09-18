import {
  CUSTOMER_ERROR_CODE_VALUES,
  CustomerErrorCode,
} from "@invessiv/common/constants/crm/errors/customer-error-codes";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import type { CreateCustomerRequestDto } from "@invessiv/common/contracts/crm/create-customer-request.dto";
import type { CustomerDetailDto } from "@invessiv/common/contracts/crm/customer-detail.dto";
import type { UpdateCustomerRequestDto } from "@invessiv/common/contracts/crm/update-customer-request.dto";
import type { ListCustomersResult } from "@invessiv/common/contracts/crm/results/list-customers-result";
import { WorkspaceApiEndpoint } from "@/common/constants/api-endpoints";
import { versionedJsonMutationService } from "@/client/shared/versioned-json-mutation-service";
import type {
  CustomerMutationClientResult,
  CustomerReadClientResult,
  CustomerSearchClientResult,
} from "@/common/contracts/crm/customer-client-results";
import type { CustomerListFilters } from "@/common/contracts/crm/customer-list-filters";
import { crmCustomerEndpoint } from "@/common/patterns/crm/crm-api-endpoints";
import { buildCustomerListQueryString } from "@/lib/workspace/crm/customer-list-query-string";

/** Envelope key both the server response and the client result DTOs use for a single customer. */
const CUSTOMER_RESULT_KEY = "customer";
/** Envelope key for a paginated customer collection response. */
const CUSTOMER_SEARCH_RESULT_KEY = "result";

function isCustomerDetail(value: unknown): value is CustomerDetailDto {
  return (
    versionedJsonMutationService.isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.version === "number"
  );
}

function isCustomerListResult(value: unknown): value is ListCustomersResult {
  return (
    versionedJsonMutationService.isRecord(value) &&
    typeof value.hasCustomers === "boolean" &&
    typeof value.page === "number" &&
    typeof value.perPage === "number" &&
    Array.isArray(value.rows) &&
    typeof value.total === "number"
  );
}

function mutate(
  url: string,
  method: HttpMethod,
  body: unknown,
): Promise<CustomerMutationClientResult> {
  return versionedJsonMutationService.mutateNamed(
    CUSTOMER_RESULT_KEY,
    url,
    method,
    body,
    (payload) =>
      versionedJsonMutationService.isRecord(payload) &&
      isCustomerDetail(payload.customer)
        ? payload.customer
        : null,
    isCustomerDetail,
    CUSTOMER_ERROR_CODE_VALUES,
    CustomerErrorCode.Internal,
  );
}

function createCustomer(
  request: CreateCustomerRequestDto,
): Promise<CustomerMutationClientResult> {
  return mutate(WorkspaceApiEndpoint.CrmCustomers, HttpMethod.Post, request);
}

function updateCustomer(
  customerId: string,
  request: UpdateCustomerRequestDto,
): Promise<CustomerMutationClientResult> {
  return mutate(crmCustomerEndpoint(customerId), HttpMethod.Patch, request);
}

function getCustomer(customerId: string): Promise<CustomerReadClientResult> {
  return versionedJsonMutationService.readNamed(
    CUSTOMER_RESULT_KEY,
    crmCustomerEndpoint(customerId),
    (payload) =>
      versionedJsonMutationService.isRecord(payload) &&
      isCustomerDetail(payload.customer)
        ? payload.customer
        : null,
    CUSTOMER_ERROR_CODE_VALUES,
    CustomerErrorCode.Internal,
  );
}

function searchCustomers(
  filters: CustomerListFilters,
): Promise<CustomerSearchClientResult> {
  const query = buildCustomerListQueryString(filters);
  const endpoint = query
    ? `${WorkspaceApiEndpoint.CrmCustomers}?${query}`
    : WorkspaceApiEndpoint.CrmCustomers;
  return versionedJsonMutationService.readNamed(
    CUSTOMER_SEARCH_RESULT_KEY,
    endpoint,
    (payload) => (isCustomerListResult(payload) ? payload : null),
    CUSTOMER_ERROR_CODE_VALUES,
    CustomerErrorCode.Internal,
  );
}

export const customersApiService = {
  createCustomer,
  getCustomer,
  searchCustomers,
  updateCustomer,
} as const;
