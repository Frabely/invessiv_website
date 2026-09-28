import type { VersionedWriteInput } from "../concurrency/versioned";

export interface UpdateFileRequestDto extends VersionedWriteInput {
  /** Omit to retain the assignment, null to move to customer-wide. */
  projectId?: string | null;
  /** Editable only for internal entries. */
  visibleToCustomer?: boolean;
  /** Omit to retain the annotation, null to clear it. */
  note?: string | null;
}
