import type { AccessScopeType } from "@invessiv/common/constants/auth/access-scope-types";

/** A customer or project boundary used for a scoped role grant. */
export type AccessScopeDto =
  | { type: typeof AccessScopeType.Customer; customerId: string }
  | {
      type: typeof AccessScopeType.Project;
      customerId: string;
      projectId: string;
    };
