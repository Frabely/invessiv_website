import { leadEmailContacts } from "@/server/db/record-configuration/lead-email-contacts";

type LeadEmailContactInsert = typeof leadEmailContacts.$inferInsert;

export type ContactLeadEmailPersistRecord = LeadEmailContactInsert;
