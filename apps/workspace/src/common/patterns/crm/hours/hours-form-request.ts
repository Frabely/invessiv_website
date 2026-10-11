import { HourPurchaseKind } from "@invessiv/common/constants/crm/hour-purchase-kinds";
import type { CreateHourAllocationRequestDto } from "@invessiv/common/contracts/crm/hours/create-hour-allocation-request.dto";
import type { CreateHourPurchaseRequestDto } from "@invessiv/common/contracts/crm/hours/create-hour-purchase-request.dto";
import { HourAllocationDirection } from "@/common/constants/crm/hour-allocation-directions";

/** The API takes the sign in `minutes`; the form only ever handles a positive duration. */
export function toHourPurchaseRequest(values: {
  idempotencyKey: string;
  kind: HourPurchaseKind;
  minutes: number;
  purchasedOn: string;
  note: string;
}): CreateHourPurchaseRequestDto {
  return {
    idempotencyKey: values.idempotencyKey,
    kind: values.kind,
    minutes:
      values.kind === HourPurchaseKind.Correction
        ? -values.minutes
        : values.minutes,
    purchasedOn: values.purchasedOn,
    note: values.note.trim(),
  };
}

export function toHourAllocationRequest(values: {
  idempotencyKey: string;
  projectId: string;
  direction: HourAllocationDirection;
  minutes: number;
  note: string;
}): CreateHourAllocationRequestDto {
  return {
    idempotencyKey: values.idempotencyKey,
    projectId: values.projectId,
    minutes:
      values.direction === HourAllocationDirection.Release
        ? -values.minutes
        : values.minutes,
    note: values.note.trim(),
  };
}
