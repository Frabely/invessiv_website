import type { VersionedWriteInput } from "@invessiv/common/contracts/concurrency/versioned";
import type { CustomerStatus } from "@invessiv/common/constants/crm/customer-statuses";
import type { CustomerWriteFieldsDto } from "@invessiv/common/contracts/crm/customer-write-fields.dto";
import type { CustomerContactWriteDto } from "@invessiv/common/contracts/crm/customer-contact-write.dto";

/**
 * Body of `PATCH /api/workspace/crm/customers/[id]`. Replaces every write field, so the
 * client always sends the complete form. `contacts`, when supplied, is the complete
 * desired contact list and is committed in the same transaction.
 */
export interface UpdateCustomerRequestDto
  extends CustomerWriteFieldsDto, VersionedWriteInput {
  /** Lifecycle state selected in the customer master-data form. */
  status: CustomerStatus;
  /** Complete desired contact list when contacts were edited in the same dialog. */
  contacts?: CustomerContactWriteDto[];
}
