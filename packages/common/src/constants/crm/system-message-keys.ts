/** Dictionary keys of system events; the text itself lives in each app's message dictionaries. */
export const SystemMessageKey = {
  ProjectPhaseChanged: "projectPhaseChanged",
} as const;
export type SystemMessageKey =
  (typeof SystemMessageKey)[keyof typeof SystemMessageKey];
export const SYSTEM_MESSAGE_KEY_VALUES = [
  SystemMessageKey.ProjectPhaseChanged,
] as const;

/** Parameter names stored in `messages.metadata` of a system event. */
export const SystemMessageParam = {
  ProjectTitle: "projectTitle",
  Phase: "phase",
} as const;
export type SystemMessageParam =
  (typeof SystemMessageParam)[keyof typeof SystemMessageParam];
