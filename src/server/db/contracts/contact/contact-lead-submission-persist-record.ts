import { leadSubmissions } from "@/server/db/record-configuration/lead-submissions";

type LeadSubmissionInsert = typeof leadSubmissions.$inferInsert;

export type ContactLeadSubmissionPersistRecord = LeadSubmissionInsert;
