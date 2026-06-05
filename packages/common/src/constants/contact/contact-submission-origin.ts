/**
 * Herkunftsseite einer Lead-Submission. Orthogonal zum `channel` (= was wurde
 * abgeschickt): markiert, von welcher Oberfläche der Lead stammt. So sind z. B.
 * Projekt-Anfragen von der LinkedIn-Post-Seite von denen der Startseite
 * unterscheidbar, ohne den Channel zu überladen. Default für bestehende Flows
 * ist `Website`.
 */
export const ContactSubmissionOrigin = {
  Website: "website",
  LinkedInPost: "linkedin_post",
} as const;

export type ContactSubmissionOrigin =
  (typeof ContactSubmissionOrigin)[keyof typeof ContactSubmissionOrigin];

export const CONTACT_SUBMISSION_ORIGIN_VALUES = [
  ContactSubmissionOrigin.Website,
  ContactSubmissionOrigin.LinkedInPost,
] as const;
