import { Permission } from "@invessiv/common/constants/auth/permissions";

/**
 * Exhaustive access contract for every currently implemented CRM API route.
 * `scope` means that a route admits bound roles and verifies the concrete customer/project in
 * its query or command; `workspace` deliberately requires a global permission.
 */
export const CrmEndpointAccessRule = {
  CustomerAccessScopes: "customer_access_scopes",
  CustomerDetail: "customer_detail",
  CustomerUpdate: "customer_update",
  CustomerProjects: "customer_projects",
  Customers: "customers",
  LeadConversion: "lead_conversion",
  ProjectDetail: "project_detail",
  ProjectCreate: "project_create",
  ProjectLineItemDetail: "project_line_item_detail",
  ProjectLineItems: "project_line_items",
  ProjectLineItemCreate: "project_line_item_create",
  LineItemTemplateDetail: "line_item_template_detail",
  LineItemTemplates: "line_item_templates",
} as const;

export type CrmEndpointAccessRule =
  (typeof CrmEndpointAccessRule)[keyof typeof CrmEndpointAccessRule];

export const CRM_ENDPOINT_ACCESS_RULES = {
  [CrmEndpointAccessRule.CustomerAccessScopes]: {
    permission: Permission.MembersManage,
    scope: "workspace",
  },
  [CrmEndpointAccessRule.CustomerDetail]: {
    permission: Permission.CustomersRead,
    scope: "customer",
  },
  [CrmEndpointAccessRule.CustomerUpdate]: {
    permission: Permission.CustomersWrite,
    scope: "customer",
  },
  [CrmEndpointAccessRule.CustomerProjects]: {
    permission: Permission.ProjectsRead,
    scope: "project",
  },
  [CrmEndpointAccessRule.Customers]: {
    permission: Permission.CustomersRead,
    scope: "list",
  },
  [CrmEndpointAccessRule.LeadConversion]: {
    permission: Permission.CustomersWrite,
    scope: "workspace",
  },
  [CrmEndpointAccessRule.ProjectDetail]: {
    permission: Permission.ProjectsWrite,
    scope: "project",
  },
  [CrmEndpointAccessRule.ProjectCreate]: {
    permission: Permission.ProjectsWrite,
    scope: "customer",
  },
  [CrmEndpointAccessRule.ProjectLineItemDetail]: {
    permission: Permission.ProjectLineItemsWrite,
    scope: "project",
  },
  [CrmEndpointAccessRule.ProjectLineItems]: {
    permission: Permission.ProjectLineItemsRead,
    scope: "project",
  },
  [CrmEndpointAccessRule.ProjectLineItemCreate]: {
    permission: Permission.ProjectLineItemsWrite,
    scope: "project",
  },
  [CrmEndpointAccessRule.LineItemTemplateDetail]: {
    permission: Permission.LineItemTemplatesWrite,
    scope: "workspace",
  },
  [CrmEndpointAccessRule.LineItemTemplates]: {
    permission: Permission.LineItemTemplatesRead,
    scope: "workspace",
  },
} as const satisfies Record<
  CrmEndpointAccessRule,
  {
    permission: Permission;
    scope: "customer" | "list" | "project" | "workspace";
  }
>;
