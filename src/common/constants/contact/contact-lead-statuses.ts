import type { ContactLeadStatus } from "@/common/contracts/contact/records/contact-lead-status";

export const CONTACT_LEAD_STATUS_VALUES = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "on_hold",
  "won",
  "lost",
  "archived",
] as const satisfies readonly ContactLeadStatus[];
