import type { CustomerPrimaryContactInputDto } from "@invessiv/common/contracts/crm/customer-primary-contact-input.dto";

/**
 * Complete desired state of one contact in a customer edit request. Existing contacts
 * carry their versions; a missing `id` represents a new contact.
 */
export interface CustomerContactWriteDto extends CustomerPrimaryContactInputDto {
  assignmentVersion?: number;
  id?: string;
  isPrimary: boolean;
  personId?: string;
  personVersion?: number;
}
