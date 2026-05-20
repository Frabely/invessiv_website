import type { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";
import type { CreateLeadCoreInput } from "./create-lead-core-input";

export interface CreateLeadRequestDto extends CreateLeadCoreInput {
  lead_status?: ContactLeadStatus;
}
