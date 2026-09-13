import type { z } from "zod";
import { RoleErrorCode } from "@invessiv/common/constants/auth/errors/role-error-codes";
import type { RoleDto } from "@invessiv/common/contracts/auth/role.dto";

export type CreateRoleResult =
  | { ok: true; role: RoleDto }
  | {
      ok: false;
      code: typeof RoleErrorCode.ValidationError;
      errors: z.ZodError["issues"];
    }
  | {
      ok: false;
      code:
        | typeof RoleErrorCode.RoleNameTaken
        | typeof RoleErrorCode.PermissionNotDelegable;
    };
