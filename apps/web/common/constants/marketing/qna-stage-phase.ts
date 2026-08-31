export const QNA_STAGE_PHASE = {
  Question: "question",
  Handover: "handover",
  Board: "board",
} as const;

export type QnaStagePhase =
  (typeof QNA_STAGE_PHASE)[keyof typeof QNA_STAGE_PHASE];
