import {
  type Permission,
  PERMISSION_VALUES,
} from "@invessiv/common/constants/auth/permissions";
import type { PermissionHolder } from "@invessiv/common/contracts/auth/permission-holder";

export function can(holder: PermissionHolder, permission: Permission): boolean {
  return holder.permissions.has(permission);
}

export function isPermission(value: string): value is Permission {
  return PERMISSION_VALUES.some((permission) => permission === value);
}
