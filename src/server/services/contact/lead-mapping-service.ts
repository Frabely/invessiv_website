import "server-only";
import { randomUUID } from "node:crypto";
import type { ContactLeadStatus } from "@/common/constants/contact/contact-lead-statuses";
import { LeadSource } from "@/common/constants/leads/lead-sources";
import type { ContactLeadPersistRecord } from "@/server/db/contracts/contact/contact-lead-persist-record";

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
): ContactLeadPersistRecord {
  return {
    created_at: createdAt,
    email: payload.email.trim(),
    first_name: payload.firstName.trim(),
    id: randomUUID(),
    last_name: payload.lastName.trim(),
    lead_status: defaultLeadStatus,
    owner: undefined,
    source: LeadSource.Webform,
    updated_at: createdAt,
  };
}
