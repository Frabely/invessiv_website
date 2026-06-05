/** UI status of the gated "post per E-Mail schicken" action in the lead step. */
export const LeadDeliverStatus = {
  Idle: "idle",
  Sending: "sending",
  Success: "success",
  Error: "error",
} as const;

export type LeadDeliverStatus =
  (typeof LeadDeliverStatus)[keyof typeof LeadDeliverStatus];
