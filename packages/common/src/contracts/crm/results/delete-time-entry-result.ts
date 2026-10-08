import type { z } from "zod";
import type { HoursErrorCode } from "@invessiv/common/constants/crm/errors/hours-error-codes";
import type { ConcurrencyErrorCode } from "@invessiv/common/constants/errors/concurrency-error-codes";
import type { VersionConflictDto } from "@invessiv/common/contracts/concurrency/version-conflict.dto";
import type { ProjectHoursBalanceDto } from "@invessiv/common/contracts/crm/hours/project-hours-balance.dto";
import type { TimeEntryDto } from "@invessiv/common/contracts/crm/hours/time-entry.dto";

export type DeleteTimeEntryResult =
  | { ok: true; deleted: true; project: ProjectHoursBalanceDto }
  | {
      ok: false;
      code: typeof HoursErrorCode.ValidationError;
      errors: z.ZodError["issues"];
    }
  | { ok: false; code: typeof HoursErrorCode.TimeEntryNotFound }
  | {
      ok: false;
      code: typeof ConcurrencyErrorCode.VersionConflict;
      conflict: VersionConflictDto<TimeEntryDto>;
    };
