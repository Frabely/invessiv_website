import { leadSubmissions } from "@invessiv/db/record-configuration/lead-submissions";

type LeadSubmissionInsert = typeof leadSubmissions.$inferInsert;

export type ContactLeadSubmissionPersistRecord = LeadSubmissionInsert;
