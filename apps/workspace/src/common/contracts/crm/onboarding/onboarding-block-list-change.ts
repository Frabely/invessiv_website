/** The one server command a change of the ordered block list stands for. */
export type OnboardingBlockListChange =
  | { kind: "move"; blockId: string; direction: -1 | 1 }
  | { kind: "remove"; blockId: string }
  | null;
