import type { SystemRoleKey } from "../../constants/auth/system-role-keys";

export interface PortalRoleDto {
  /** Role ID used in invitation and membership writes. */
  id: string;
  /** Custom role name, or the persisted name of a system role. */
  name: string;
  /** Nullable for custom roles; identifies the localized standard role. */
  systemKey: SystemRoleKey | null;
  /** Inactive roles remain visible but cannot be newly assigned. */
  active: boolean;
  /** Effective permission keys used by the preview's area list. */
  permissions: string[];
}
