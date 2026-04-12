import "server-only";

export type PersistSubmissionResult = {
  persisted: boolean;
  submissionId?: string;
};
