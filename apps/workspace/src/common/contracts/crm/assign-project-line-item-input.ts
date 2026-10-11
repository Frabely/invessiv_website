import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import type { AssignmentProject } from "./assignment-project";
import type { AssignmentTemplate } from "./assignment-template";
import type { AssignmentFields } from "./assignment-fields";

export type AssignProjectLineItemInput = {
  actor: WorkspaceActor;
  idempotencyKey?: string;
  project: AssignmentProject;
  template: AssignmentTemplate;
  fields: AssignmentFields;
};
