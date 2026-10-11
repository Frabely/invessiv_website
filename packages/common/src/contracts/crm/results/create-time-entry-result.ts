import type { z } from "zod";
import type { HoursErrorCode } from "@invessiv/common/constants/crm/errors/hours-error-codes";
import type { ProjectHoursBalanceDto } from "@invessiv/common/contracts/crm/hours/project-hours-balance.dto";
import type { TimeEntryDto } from "@invessiv/common/contracts/crm/hours/time-entry.dto";

// Every successful write carries the project's new figures, so the section needs no second request.
export type CreateTimeEntryResult =
  | { ok: true; timeEntry: TimeEntryDto; project: ProjectHoursBalanceDto }
  | {
      ok: false;
      code: typeof HoursErrorCode.ValidationError;
      errors: z.ZodError["issues"];
    }
  | {
      ok: false;
      code:
        | typeof HoursErrorCode.ProjectNotFound
        | typeof HoursErrorCode.ProjectClosed
        | typeof HoursErrorCode.TaskNotLinkable;
    };
