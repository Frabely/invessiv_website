import type { VersionedWriteInput } from "@invessiv/common/contracts/concurrency/versioned";
import type { CustomerWriteFieldsDto } from "@invessiv/common/contracts/crm/customer-write-fields.dto";

/**
 * Body of `PATCH /api/workspace/crm/customers/[id]`. Replaces every write field, so the
 * client always sends the complete form. Contacts are edited separately (Task 06).
 */
export interface UpdateCustomerRequestDto
  extends CustomerWriteFieldsDto, VersionedWriteInput {}
