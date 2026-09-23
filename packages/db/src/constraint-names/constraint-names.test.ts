import { describe, expect, it } from "vitest";

import {
  ACTIVITIES_CONSTRAINT_NAME_VALUES,
  ActivitiesConstraintName,
} from "./activities-constraint-names";
import {
  PERMISSIONS_CONSTRAINT_NAME_VALUES,
  PermissionsConstraintName,
} from "./auth/permissions-constraint-names";
import {
  ROLE_PERMISSIONS_CONSTRAINT_NAME_VALUES,
  RolePermissionsConstraintName,
} from "./auth/role-permissions-constraint-names";
import {
  ROLES_CONSTRAINT_NAME_VALUES,
  RolesConstraintName,
} from "./auth/roles-constraint-names";
import {
  SECURITY_EVENTS_CONSTRAINT_NAME_VALUES,
  SecurityEventsConstraintName,
} from "./auth/security-events-constraint-names";
import {
  USERS_CONSTRAINT_NAME_VALUES,
  UsersConstraintName,
} from "./auth/users-constraint-names";
import {
  WORKSPACE_MEMBER_ROLES_CONSTRAINT_NAME_VALUES,
  WorkspaceMemberRolesConstraintName,
} from "./auth/workspace-member-roles-constraint-names";
import {
  CUSTOMERS_CONSTRAINT_NAME_VALUES,
  CustomersConstraintName,
} from "./crm/customers-constraint-names";
import {
  LINE_ITEM_TEMPLATES_CONSTRAINT_NAME_VALUES,
  LineItemTemplatesConstraintName,
} from "./crm/line-item-templates-constraint-names";
import {
  TASKS_CONSTRAINT_NAME_VALUES,
  TasksConstraintName,
} from "./crm/tasks-constraint-names";
import {
  LEAD_SOCIAL_PROFILES_CONSTRAINT_NAME_VALUES,
  LeadSocialProfilesConstraintName,
} from "./lead-social-profiles-constraint-names";
import {
  LEADS_CONSTRAINT_NAME_VALUES,
  LeadsConstraintName,
} from "./leads-constraint-names";

const GROUPS: [string, string, Record<string, string>, readonly string[]][] = [
  [
    "activities",
    "activities_",
    ActivitiesConstraintName,
    ACTIVITIES_CONSTRAINT_NAME_VALUES,
  ],
  ["users", "users_", UsersConstraintName, USERS_CONSTRAINT_NAME_VALUES],
  ["roles", "roles_", RolesConstraintName, ROLES_CONSTRAINT_NAME_VALUES],
  [
    "permissions",
    "permissions_",
    PermissionsConstraintName,
    PERMISSIONS_CONSTRAINT_NAME_VALUES,
  ],
  [
    "role_permissions",
    "role_permissions_",
    RolePermissionsConstraintName,
    ROLE_PERMISSIONS_CONSTRAINT_NAME_VALUES,
  ],
  [
    "workspace_member_roles",
    "workspace_member_roles_",
    WorkspaceMemberRolesConstraintName,
    WORKSPACE_MEMBER_ROLES_CONSTRAINT_NAME_VALUES,
  ],
  [
    "security_events",
    "security_events_",
    SecurityEventsConstraintName,
    SECURITY_EVENTS_CONSTRAINT_NAME_VALUES,
  ],
  ["leads", "leads_", LeadsConstraintName, LEADS_CONSTRAINT_NAME_VALUES],
  [
    "lead_social_profiles",
    "lead_social_profiles_",
    LeadSocialProfilesConstraintName,
    LEAD_SOCIAL_PROFILES_CONSTRAINT_NAME_VALUES,
  ],
  [
    "customers",
    "customers_",
    CustomersConstraintName,
    CUSTOMERS_CONSTRAINT_NAME_VALUES,
  ],
  [
    "line_item_templates",
    "line_item_templates_",
    LineItemTemplatesConstraintName,
    LINE_ITEM_TEMPLATES_CONSTRAINT_NAME_VALUES,
  ],
  ["tasks", "tasks_", TasksConstraintName, TASKS_CONSTRAINT_NAME_VALUES],
];

describe("constraint name constants", () => {
  it.each(GROUPS)(
    "lists every %s name exactly once, prefixed with its table",
    (_table, prefix, constObject, values) => {
      expect([...values]).toEqual(Object.values(constObject));
      expect(new Set(values).size).toBe(values.length);
      for (const name of values) {
        expect(name.startsWith(prefix)).toBe(true);
      }
    },
  );

  it("never reuses a name across tables", () => {
    const all = GROUPS.flatMap(([, , , values]) => values);
    expect(new Set(all).size).toBe(all.length);
  });
});
