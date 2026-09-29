import type { ProcessPlanRowKind } from "@/common/constants/crm/process-plan-row-kinds";

/** One visible editor row: a free-text step or a single feedback round. */
export type ProjectProcessPlanRow =
  | {
      kind: typeof ProcessPlanRowKind.CustomStep;
      key: string;
      stepIndex: number;
      label: string;
    }
  | {
      kind: typeof ProcessPlanRowKind.FeedbackRound;
      key: string;
      roundNumber: number;
    };
