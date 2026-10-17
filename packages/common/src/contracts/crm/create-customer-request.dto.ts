import type { CustomerPrimaryContactInputDto } from "@invessiv/common/contracts/crm/customer-primary-contact-input.dto";
import type { CustomerWriteFieldsDto } from "@invessiv/common/contracts/crm/customer-write-fields.dto";

/** Body of `POST /api/workspace/crm/customers`. Carries no version: nothing exists yet. */
export interface CreateCustomerRequestDto extends CustomerWriteFieldsDto {
  /**
   * Chosen once when creating; no update carries it. Any integer from 1 to
   * `CustomerFieldLimits.CustomerNumberMax` that no customer holds, archived ones included —
   * a taken number answers `CUSTOMER_NUMBER_TAKEN`.
   */
  customerNumber: number;
  /**
   * Mandatory: a customer is never committed without its primary contact.
   */
  primaryContact: CustomerPrimaryContactInputDto;
  /** Additional contacts are optional, but commit in the same transaction. */
  additionalContacts?: CustomerPrimaryContactInputDto[];
}
