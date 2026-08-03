import type { LeadPitchErrorCode } from "@invessiv/common/constants/leads/outreach/lead-pitch-error-codes";
import type { LeadPitchDraftDto } from "./lead-pitch-draft.dto";

export interface GeneratePitchSuccessDto {
  ok: true;
  draft: LeadPitchDraftDto;
}

export interface GeneratePitchFailureDto {
  ok: false;
  code: LeadPitchErrorCode;
}

export type GeneratePitchResultDto =
  GeneratePitchSuccessDto | GeneratePitchFailureDto;
