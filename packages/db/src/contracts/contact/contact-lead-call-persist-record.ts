import { leadCallContacts } from "@invessiv/db/record-configuration/lead-call-contacts";

type LeadCallContactInsert = typeof leadCallContacts.$inferInsert;

export type ContactLeadCallPersistRecord = LeadCallContactInsert;
