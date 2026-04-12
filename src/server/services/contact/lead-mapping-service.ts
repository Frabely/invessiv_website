import "server-only";
import { randomUUID } from "node:crypto";
import type { ContactLeadStatus } from "@/common/contracts/contact/records/contact-lead-status";
import type { PreparedLeadRecord } from "@/server/db/records/contact/prepared-lead-record";

export type ApiToDbMapperOptions = {
  createdAt?: Date;
  requestId: string;
};

export type LeadMapperInput = {
  email: string;
  firstName: string;
  lastName: string;
};

type MapperDependencies = {
  defaultLeadStatus: ContactLeadStatus;
};

export function mapLeadApiToDb(
  payload: LeadMapperInput,
  createdAt: Date,
  { defaultLeadStatus }: MapperDependencies,
): PreparedLeadRecord {
  return {
    createdAt,
    email: payload.email.trim(),
    firstName: payload.firstName.trim(),
    id: randomUUID(),
    lastName: payload.lastName.trim(),
    leadStatus: defaultLeadStatus,
    updatedAt: createdAt,
  };
}
