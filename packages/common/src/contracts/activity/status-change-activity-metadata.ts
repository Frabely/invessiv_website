import type { StatusChangeOrigin } from "@invessiv/common/constants/activity/status-change-origins";
import type { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";

export type StatusChangeActivityMetadata = {
  previous_status: ContactLeadStatus;
  next_status: ContactLeadStatus;
  origin?: StatusChangeOrigin;
};
