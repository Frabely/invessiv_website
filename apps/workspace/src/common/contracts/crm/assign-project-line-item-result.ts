import type { ProjectLineItemRow } from "@invessiv/common/contracts/crm/rows/project-line-item-row";
import type { AssignProjectLineItemFailureCode } from "./assign-project-line-item-failure-code";

export type AssignProjectLineItemResult =
  | { ok: true; row: ProjectLineItemRow }
  | { ok: false; code: AssignProjectLineItemFailureCode };
