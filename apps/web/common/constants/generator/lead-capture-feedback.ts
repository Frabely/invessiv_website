/** Which gated action produced the currently shown confirmation, if any. */
export const LeadCaptureFeedback = {
  Download: "download",
  Email: "email",
} as const;

export type LeadCaptureFeedback =
  (typeof LeadCaptureFeedback)[keyof typeof LeadCaptureFeedback];
