/** Constraint and index names of `security_events`, declared once for the model and smokes. */
export const SecurityEventsConstraintName = {
  TypeCheck: "security_events_type_check",
  ActorTypeCheck: "security_events_actor_type_check",
  SubjectTypeCheck: "security_events_subject_type_check",
  ActorCheck: "security_events_actor_check",
  SubjectOccurredAtIndex: "security_events_subject_occurred_at_idx",
  OccurredAtIndex: "security_events_occurred_at_idx",
} as const;

export type SecurityEventsConstraintName =
  (typeof SecurityEventsConstraintName)[keyof typeof SecurityEventsConstraintName];

export const SECURITY_EVENTS_CONSTRAINT_NAME_VALUES = [
  SecurityEventsConstraintName.TypeCheck,
  SecurityEventsConstraintName.ActorTypeCheck,
  SecurityEventsConstraintName.SubjectTypeCheck,
  SecurityEventsConstraintName.ActorCheck,
  SecurityEventsConstraintName.SubjectOccurredAtIndex,
  SecurityEventsConstraintName.OccurredAtIndex,
] as const;
