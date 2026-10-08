import {
  HOURS_ERROR_CODE_VALUES,
  HoursErrorCode,
} from "@invessiv/common/constants/crm/errors/hours-error-codes";
import { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import { HttpMethod } from "@invessiv/common/constants/http/http-methods";
import type { CreateHourAllocationRequestDto } from "@invessiv/common/contracts/crm/hours/create-hour-allocation-request.dto";
import type { CreateHourPurchaseRequestDto } from "@invessiv/common/contracts/crm/hours/create-hour-purchase-request.dto";
import type { CustomerHoursBalanceDto } from "@invessiv/common/contracts/crm/hours/customer-hours-balance.dto";
import type { HourAllocationDto } from "@invessiv/common/contracts/crm/hours/hour-allocation.dto";
import type { HourPurchaseDto } from "@invessiv/common/contracts/crm/hours/hour-purchase.dto";
import type { ProjectHoursBalanceDto } from "@invessiv/common/contracts/crm/hours/project-hours-balance.dto";
import type { CreateTimeEntryRequestDto } from "@invessiv/common/contracts/crm/hours/create-time-entry-request.dto";
import type { TimeEntryDto } from "@invessiv/common/contracts/crm/hours/time-entry.dto";
import type { TimeEntryPageDto } from "@invessiv/common/contracts/crm/hours/time-entry-page.dto";
import type { UpdateTimeEntryRequestDto } from "@invessiv/common/contracts/crm/hours/update-time-entry-request.dto";
import type { VersionedWriteInput } from "@invessiv/common/contracts/concurrency/versioned";
import type { JsonClientResult } from "@/common/contracts/client/json-client-result";
import type { TimeEntryClientResult } from "@/common/contracts/crm/hours/time-entry-client-result";
import { TimeEntryQueryParam } from "@/common/constants/crm/time-entry-query-params";
import { versionedJsonMutationService as json } from "@/client/shared/versioned-json-mutation-service";
import type { HourAllocationClientResult } from "@/common/contracts/crm/hours/hour-allocation-client-result";
import type { HourPurchaseClientResult } from "@/common/contracts/crm/hours/hour-purchase-client-result";
import {
  crmCustomerHourAllocationsEndpoint,
  crmCustomerHourPurchasesEndpoint,
  crmProjectTimeEntriesEndpoint,
  crmTimeEntryEndpoint,
} from "@/common/patterns/crm/crm-api-endpoints";

function isCustomerBalance(value: unknown): value is CustomerHoursBalanceDto {
  return (
    json.isRecord(value) &&
    typeof value.purchasedMinutes === "number" &&
    typeof value.freeMinutes === "number" &&
    typeof value.remainingMinutes === "number"
  );
}

function isProjectBalance(value: unknown): value is ProjectHoursBalanceDto {
  return (
    json.isRecord(value) &&
    typeof value.projectId === "string" &&
    typeof value.allocatedMinutes === "number" &&
    typeof value.releasableMinutes === "number"
  );
}

function isLedgerRow(value: unknown): value is { id: string; minutes: number } {
  return (
    json.isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.minutes === "number"
  );
}

/** The figures a rejected write carries under `details`; null when the answer has none. */
function readDetails(payload: unknown): Record<string, unknown> | null {
  return json.isRecord(payload) && json.isRecord(payload.details)
    ? payload.details
    : null;
}

async function createPurchase(
  customerId: string,
  request: CreateHourPurchaseRequestDto,
): Promise<HourPurchaseClientResult> {
  const response = await json.send(
    crmCustomerHourPurchasesEndpoint(customerId),
    HttpMethod.Post,
    request,
  );
  if (!response) {
    return { ok: false, code: HoursErrorCode.Internal, balance: null };
  }

  const payload = response.payload;
  if (
    response.ok &&
    json.isRecord(payload) &&
    isLedgerRow(payload.purchase) &&
    isCustomerBalance(payload.balance)
  ) {
    return {
      ok: true,
      purchase: payload.purchase as HourPurchaseDto,
      balance: payload.balance,
    };
  }

  const balance = readDetails(payload)?.balance;
  return {
    ok: false,
    // A 2xx answer of an unexpected shape is a failure too, never a silent success.
    code: response.ok
      ? HoursErrorCode.Internal
      : json.readErrorCode(
          payload,
          HOURS_ERROR_CODE_VALUES,
          HoursErrorCode.Internal,
        ),
    balance: isCustomerBalance(balance) ? balance : null,
  };
}

async function createAllocation(
  customerId: string,
  request: CreateHourAllocationRequestDto,
): Promise<HourAllocationClientResult> {
  const response = await json.send(
    crmCustomerHourAllocationsEndpoint(customerId),
    HttpMethod.Post,
    request,
  );
  if (!response) {
    return {
      ok: false,
      code: HoursErrorCode.Internal,
      balance: null,
      project: null,
    };
  }

  const payload = response.payload;
  if (
    response.ok &&
    json.isRecord(payload) &&
    isLedgerRow(payload.allocation) &&
    isCustomerBalance(payload.balance) &&
    isProjectBalance(payload.project)
  ) {
    return {
      ok: true,
      allocation: payload.allocation as HourAllocationDto,
      balance: payload.balance,
      project: payload.project,
    };
  }

  const details = readDetails(payload);
  return {
    ok: false,
    code: response.ok
      ? HoursErrorCode.Internal
      : json.readErrorCode(
          payload,
          HOURS_ERROR_CODE_VALUES,
          HoursErrorCode.Internal,
        ),
    balance: isCustomerBalance(details?.balance) ? details.balance : null,
    project: isProjectBalance(details?.project) ? details.project : null,
  };
}

function isTimeEntry(value: unknown): value is TimeEntryDto {
  return (
    json.isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.version === "number" &&
    typeof value.durationMinutes === "number"
  );
}

function readErrorCode(payload: unknown): HoursErrorCode {
  return json.readErrorCode(
    payload,
    HOURS_ERROR_CODE_VALUES,
    HoursErrorCode.Internal,
  );
}

/** One unwrap for booking, changing and deleting: all three answer with the project figures. */
async function writeTimeEntry(
  url: string,
  method: HttpMethod,
  body: unknown,
): Promise<TimeEntryClientResult> {
  const response = await json.send(url, method, body);
  if (!response) return { ok: false, code: HoursErrorCode.Internal };

  const payload = response.payload;
  if (
    response.ok &&
    json.isRecord(payload) &&
    isProjectBalance(payload.project)
  ) {
    return {
      ok: true,
      timeEntry: isTimeEntry(payload.timeEntry) ? payload.timeEntry : null,
      project: payload.project,
    };
  }

  const current = json.readVersionConflict(response, isTimeEntry);
  if (current) {
    return { ok: false, code: ConcurrencyErrorCode.VersionConflict, current };
  }
  return {
    ok: false,
    code: response.ok ? HoursErrorCode.Internal : readErrorCode(payload),
  };
}

function createTimeEntry(
  projectId: string,
  request: CreateTimeEntryRequestDto,
): Promise<TimeEntryClientResult> {
  return writeTimeEntry(
    crmProjectTimeEntriesEndpoint(projectId),
    HttpMethod.Post,
    request,
  );
}

function updateTimeEntry(
  timeEntryId: string,
  request: UpdateTimeEntryRequestDto,
): Promise<TimeEntryClientResult> {
  return writeTimeEntry(
    crmTimeEntryEndpoint(timeEntryId),
    HttpMethod.Patch,
    request,
  );
}

function deleteTimeEntry(
  timeEntryId: string,
  request: VersionedWriteInput,
): Promise<TimeEntryClientResult> {
  return writeTimeEntry(
    crmTimeEntryEndpoint(timeEntryId),
    HttpMethod.Delete,
    request,
  );
}

function listTimeEntries(
  projectId: string,
  cursor: string | null,
): Promise<JsonClientResult<TimeEntryPageDto, HoursErrorCode>> {
  const query = cursor
    ? `?${new URLSearchParams({ [TimeEntryQueryParam.Cursor]: cursor })}`
    : "";
  return json.read(
    `${crmProjectTimeEntriesEndpoint(projectId)}${query}`,
    (payload) =>
      json.isRecord(payload) &&
      Array.isArray(payload.entries) &&
      payload.entries.every(isTimeEntry)
        ? {
            entries: payload.entries,
            nextCursor:
              typeof payload.nextCursor === "string"
                ? payload.nextCursor
                : null,
          }
        : null,
    HOURS_ERROR_CODE_VALUES,
    HoursErrorCode.Internal,
  );
}

export const hoursApiService = {
  createPurchase,
  createAllocation,
  listTimeEntries,
  createTimeEntry,
  updateTimeEntry,
  deleteTimeEntry,
} as const;
