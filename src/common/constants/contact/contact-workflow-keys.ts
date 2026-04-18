export const CONTACT_WORKFLOW_KEY = {
  BuildInternalTool: "build_internal_tool",
  ConnectDataOrSystems: "connect_data_or_systems",
  DigitizeExistingProcess: "digitize_existing_process",
  ImproveExistingTool: "improve_existing_tool",
  OtherProcess: "other_process",
  SimplifyManualProcess: "simplify_manual_process",
} as const;

export const CONTACT_WORKFLOW_KEYS = [
  CONTACT_WORKFLOW_KEY.DigitizeExistingProcess,
  CONTACT_WORKFLOW_KEY.SimplifyManualProcess,
  CONTACT_WORKFLOW_KEY.ConnectDataOrSystems,
  CONTACT_WORKFLOW_KEY.BuildInternalTool,
  CONTACT_WORKFLOW_KEY.ImproveExistingTool,
  CONTACT_WORKFLOW_KEY.OtherProcess,
] as const;

export type ContactWorkflowKey = (typeof CONTACT_WORKFLOW_KEYS)[number];
