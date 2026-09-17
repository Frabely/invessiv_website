/** Constraint and index names of `activities`, shared by the model and database checks. */
export const ActivitiesConstraintName = {
  SubjectCheck: "activities_subject_check",
  TypeCheck: "activities_type_check",
  ActorTypeCheck: "activities_actor_type_check",
  ActorCheck: "activities_actor_check",
  CustomerOccurredAtIndex: "activities_customer_id_occurred_at_idx",
  LeadOccurredAtIndex: "activities_lead_id_occurred_at_idx",
  ProjectOccurredAtIndex: "activities_project_id_occurred_at_idx",
  TypeOccurredAtIndex: "activities_type_occurred_at_idx",
} as const;

export type ActivitiesConstraintName =
  (typeof ActivitiesConstraintName)[keyof typeof ActivitiesConstraintName];

export const ACTIVITIES_CONSTRAINT_NAME_VALUES = [
  ActivitiesConstraintName.SubjectCheck,
  ActivitiesConstraintName.TypeCheck,
  ActivitiesConstraintName.ActorTypeCheck,
  ActivitiesConstraintName.ActorCheck,
  ActivitiesConstraintName.CustomerOccurredAtIndex,
  ActivitiesConstraintName.LeadOccurredAtIndex,
  ActivitiesConstraintName.ProjectOccurredAtIndex,
  ActivitiesConstraintName.TypeOccurredAtIndex,
] as const;
