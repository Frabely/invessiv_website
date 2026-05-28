import type { WorkflowCheckFormValues } from "@invessiv/common/contracts/contact/forms/workflow-check-form-values";

export type SubmitWorkflowCheckResult =
  | { ok: true }
  | { ok: false; fieldErrors?: Record<string, string[]>; code: string };

// STUB — wird in Track C (Task C1) durch echte Mapper+Fetch-Implementierung ersetzt.
export async function submitWorkflowCheck(
  _values: WorkflowCheckFormValues,
): Promise<SubmitWorkflowCheckResult> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return { ok: true };
}
