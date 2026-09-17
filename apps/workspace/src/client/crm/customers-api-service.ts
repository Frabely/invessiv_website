import {
  CUSTOMER_ERROR_CODE_VALUES,
  CustomerErrorCode,
} from "@invessiv/common/constants/crm/errors/customer-error-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { HttpHeaderName } from "@invessiv/common/constants/http/http-header-names";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import { HttpResponseCode } from "@invessiv/common/constants/http/http-response-codes";
import { MediaType } from "@invessiv/common/constants/http/media-types";
import type { CreateCustomerRequestDto } from "@invessiv/common/contracts/crm/create-customer-request.dto";
import type { CustomerDetailDto } from "@invessiv/common/contracts/crm/customer-detail.dto";
import type { UpdateCustomerRequestDto } from "@invessiv/common/contracts/crm/update-customer-request.dto";
import type { ListCustomersResult } from "@invessiv/common/contracts/crm/results/list-customers-result";
import { WorkspaceApiEndpoint } from "@/common/constants/api-endpoints";
import type {
  CustomerMutationClientResult,
  CustomerReadClientResult,
  CustomerSearchClientResult,
} from "@/common/contracts/crm/customer-client-results";
import type { CustomerListFilters } from "@/common/contracts/crm/customer-list-filters";
import { crmCustomerEndpoint } from "@/common/patterns/crm/crm-api-endpoints";
import { buildCustomerListQueryString } from "@/lib/workspace/crm/customer-list-query-string";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCustomerDetail(value: unknown): value is CustomerDetailDto {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.version === "number"
  );
}

function isCustomerListResult(value: unknown): value is ListCustomersResult {
  return (
    isRecord(value) &&
    typeof value.hasCustomers === "boolean" &&
    typeof value.page === "number" &&
    typeof value.perPage === "number" &&
    Array.isArray(value.rows) &&
    typeof value.total === "number"
  );
}

function readErrorCode(payload: unknown): CustomerErrorCode {
  const error = isRecord(payload) ? payload.error : undefined;
  return (
    CUSTOMER_ERROR_CODE_VALUES.find((code) => code === error) ??
    CustomerErrorCode.Internal
  );
}

async function mutate(
  url: string,
  method: HttpMethod,
  body: unknown,
): Promise<CustomerMutationClientResult> {
  let response: Response;
  let payload: unknown;
  try {
    response = await fetch(url, {
      method,
      body: JSON.stringify(body),
      headers: { [HttpHeaderName.ContentType]: MediaType.Json },
    });
    payload = (await response.json().catch(() => null)) as unknown;
  } catch {
    return { ok: false, code: CustomerErrorCode.Internal };
  }

  if (response.ok && isRecord(payload) && isCustomerDetail(payload.customer)) {
    return { ok: true, customer: payload.customer };
  }

  if (
    response.status === HttpResponseCode.Conflict &&
    isRecord(payload) &&
    payload.code === ConcurrencyErrorCode.VersionConflict &&
    isCustomerDetail(payload.current)
  ) {
    return {
      ok: false,
      code: ConcurrencyErrorCode.VersionConflict,
      current: payload.current,
    };
  }

  return { ok: false, code: readErrorCode(payload) };
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

async function getCustomer(
  customerId: string,
): Promise<CustomerReadClientResult> {
  try {
    const response = await fetch(crmCustomerEndpoint(customerId), {
      method: HttpMethod.Get,
    });
    const payload = (await response.json().catch(() => null)) as unknown;
    if (
      response.ok &&
      isRecord(payload) &&
      isCustomerDetail(payload.customer)
    ) {
      return { ok: true, customer: payload.customer };
    }
    return { ok: false, code: readErrorCode(payload) };
  } catch {
    return { ok: false, code: CustomerErrorCode.Internal };
  }
}

async function searchCustomers(
  filters: CustomerListFilters,
): Promise<CustomerSearchClientResult> {
  const query = buildCustomerListQueryString(filters);
  const endpoint = query
    ? `${WorkspaceApiEndpoint.CrmCustomers}?${query}`
    : WorkspaceApiEndpoint.CrmCustomers;
  try {
    const response = await fetch(endpoint, { method: HttpMethod.Get });
    const payload = (await response.json().catch(() => null)) as unknown;
    if (response.ok && isCustomerListResult(payload)) {
      return { ok: true, result: payload };
    }
    return { ok: false, code: readErrorCode(payload) };
  } catch {
    return { ok: false, code: CustomerErrorCode.Internal };
  }
}

export const customersApiService = {
  createCustomer,
  getCustomer,
  searchCustomers,
  updateCustomer,
} as const;
