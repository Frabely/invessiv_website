/** Allocates free hours of a customer to one of its projects, or releases unused ones again. */
export interface CreateHourAllocationRequestDto {
  /** Created once when the dialog opens; a repeated request with it returns the first row instead of a second one. */
  idempotencyKey: string;
  /** Must be a project of the customer in the URL; the customer itself never comes from the body. */
  projectId: string;
  /** Signed whole minutes: positive allocates, negative releases. */
  minutes: number;
  /** Internal remark; send an empty string for none. */
  note: string;
}
