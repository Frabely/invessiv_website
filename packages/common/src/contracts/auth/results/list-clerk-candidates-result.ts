import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import type { ClerkCandidateDto } from "@invessiv/common/contracts/auth/clerk-candidate.dto";

export type ListClerkCandidatesResult =
  | { ok: true; candidates: ClerkCandidateDto[] }
  | { ok: false; code: typeof WorkspaceMemberErrorCode.ClerkUnavailable };
