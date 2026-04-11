import "server-only";
import { randomUUID } from "node:crypto";
import type { PreparedLeadRecord } from "@/server/db/records/contact/prepared-lead-record";
import type { ContactLeadStatus } from "@/server/config/contact-lead-storage";

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
