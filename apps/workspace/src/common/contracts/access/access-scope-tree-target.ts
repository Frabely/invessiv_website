import { AccessScopeType } from "@invessiv/common/constants/auth/access-scope-types";

export type AccessScopeTreeTarget =
  | {
      type: typeof AccessScopeType.Customer;
      customerId: string;
      label: string;
    }
  | {
      type: typeof AccessScopeType.Project;
      customerId: string;
      projectId: string;
      label: string;
    };
