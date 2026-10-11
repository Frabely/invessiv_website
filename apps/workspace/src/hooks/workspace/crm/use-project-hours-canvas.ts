"use client";

import { useState } from "react";
import type { TimeEntryDto } from "@invessiv/common/contracts/crm/hours/time-entry.dto";
import type { TimeEntryDialogState } from "@/common/contracts/crm/hours/time-entry-dialog-state";

/** Mounted per project so switching tabs cannot retain another project's open form. */
export function useProjectHoursCanvas() {
  const [dialog, setDialog] = useState<TimeEntryDialogState | null>(null);
  const [revision, setRevision] = useState(0);
  return {
    dialog,
    revision,
    open: (entry: TimeEntryDto | null, taskId: string | null = null) =>
      setDialog({ entry, taskId }),
    close: () => setDialog(null),
    changed: () => setRevision((current) => current + 1),
  };
}
