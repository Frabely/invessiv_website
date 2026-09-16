import type { CustomerPrimaryContactInputDto } from "@invessiv/common/contracts/crm/customer-primary-contact-input.dto";
import type { CustomerWriteFieldsDto } from "@invessiv/common/contracts/crm/customer-write-fields.dto";

/** Body of `POST /api/workspace/crm/customers`. Carries no version: nothing exists yet. */
export interface CreateCustomerRequestDto extends CustomerWriteFieldsDto {
  /**
   * Mandatory: a customer is never committed without its primary contact.
   */
  primaryContact: CustomerPrimaryContactInputDto;
  /** Additional contacts are optional, but commit in the same transaction. */
  additionalContacts?: CustomerPrimaryContactInputDto[];
}
