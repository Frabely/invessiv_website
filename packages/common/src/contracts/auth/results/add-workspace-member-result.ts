import type { z } from "zod";
import { WorkspaceMemberErrorCode } from "@invessiv/common/constants/auth/errors/workspace-member-error-codes";
import type { WorkspaceMemberDto } from "@invessiv/common/contracts/auth/workspace-member.dto";

export type AddWorkspaceMemberResult =
  | { ok: true; member: WorkspaceMemberDto }
  | {
      ok: false;
      code: typeof WorkspaceMemberErrorCode.ValidationError;
      errors: z.ZodError["issues"];
    }
  | {
      ok: false;
      code:
        | typeof WorkspaceMemberErrorCode.ClerkAccountNotFound
        | typeof WorkspaceMemberErrorCode.ClerkAccountIncomplete
        | typeof WorkspaceMemberErrorCode.ClerkAccountAlreadyLinked
        | typeof WorkspaceMemberErrorCode.ClerkUnavailable
        | typeof WorkspaceMemberErrorCode.RoleNotAssignable
        | typeof WorkspaceMemberErrorCode.OwnerRoleNotAssignable
        | typeof WorkspaceMemberErrorCode.MemberWithoutRole;
    };
