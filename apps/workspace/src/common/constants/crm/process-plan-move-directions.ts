export const ProcessPlanMoveDirection = {
  Up: "up",
  Down: "down",
} as const;

export type ProcessPlanMoveDirection =
  (typeof ProcessPlanMoveDirection)[keyof typeof ProcessPlanMoveDirection];
