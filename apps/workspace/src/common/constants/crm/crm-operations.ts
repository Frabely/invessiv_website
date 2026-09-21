/** Stable operation names for CRM route logs; never contain ids, names or emails. */
export const CrmOperation = {
  ConvertLead: "leads.convert",
  ListCustomers: "customers.list",
  CreateCustomer: "customers.create",
  GetCustomer: "customers.get",
  UpdateCustomer: "customers.update",
  ListProjectLineItems: "project-line-items.list",
  CreateProjectLineItem: "project-line-items.create",
  UpdateProjectLineItem: "project-line-items.update",
  ListLineItemTemplates: "line-item-templates.list",
  CreateLineItemTemplate: "line-item-templates.create",
  UpdateLineItemTemplate: "line-item-templates.update",
} as const;

export type CrmOperation = (typeof CrmOperation)[keyof typeof CrmOperation];

export const CRM_OPERATION_VALUES = [
  CrmOperation.ConvertLead,
  CrmOperation.ListCustomers,
  CrmOperation.CreateCustomer,
  CrmOperation.GetCustomer,
  CrmOperation.UpdateCustomer,
  CrmOperation.ListProjectLineItems,
  CrmOperation.CreateProjectLineItem,
  CrmOperation.UpdateProjectLineItem,
  CrmOperation.ListLineItemTemplates,
  CrmOperation.CreateLineItemTemplate,
  CrmOperation.UpdateLineItemTemplate,
] as const;
