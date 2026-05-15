export const SubmitState = {
  Kind: {
    Error: "error",
    Idle: "idle",
    Success: "success",
  },
} as const;

export type SubmitStateKind =
  (typeof SubmitState.Kind)[keyof typeof SubmitState.Kind];
