import type { TaskStatus } from "@invessiv/common/constants/crm/task-statuses";
import type { ActivityActor } from "@invessiv/common/contracts/activity/activity-actor";
import type { tasks } from "@invessiv/db/record-configuration";

/** The thing a collecting task belongs to; exactly one of the two. */
export type CollectingTaskOrigin =
  { feedbackRoundId: string } | { onboardingFormId: string };

/** Where a collecting task lives: the customer and project its activity is written for. */
export type CollectingTaskScope = {
  customerId: string;
  projectId: string;
};

export type CollectingTaskCreation = {
  origin: CollectingTaskOrigin;
  scope: CollectingTaskScope;
  title: string;
  actor: ActivityActor;
};

export type CollectingTaskMove = {
  /** The task as it was read under lock. */
  task: typeof tasks.$inferSelect;
  scope: CollectingTaskScope;
  to: TaskStatus;
  actor: ActivityActor;
  /** Who finished the task; only used when it becomes `done`. */
  completedByMemberId: string | null;
  /** Names the aggregate in the error of a lost race under lock. */
  failure: string;
};
