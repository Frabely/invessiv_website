import type { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import type { ProjectHoursBalanceDto } from "@invessiv/common/contracts/crm/hours/project-hours-balance.dto";

/** One project row of the hours overview: its figures plus what the row needs to name itself. */
export interface CustomerHoursProjectDto extends ProjectHoursBalanceDto {
  /** Carried along so the overview does not depend on the separate right to read projects. */
  title: string;
  /** Decides whether the project still takes new hours; a closed one can only release. */
  status: ProjectStatus;
}
