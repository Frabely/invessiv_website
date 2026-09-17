import type { CreateProjectRequestDto } from "@invessiv/common/contracts/crm/create-project-request.dto";

export interface UpdateProjectRequestDto extends CreateProjectRequestDto {
  /** Optimistic concurrency version of the project being changed. */
  version: number;
}
