/** Stable operation names for CRM route logs; never contain ids, names or emails. */
export const CrmOperation = {
  ConvertLead: "leads.convert",
  ListCustomers: "customers.list",
  CreateCustomer: "customers.create",
  GetCustomer: "customers.get",
  UpdateCustomer: "customers.update",
  ListServiceTemplates: "service-templates.list",
  CreateServiceTemplate: "service-templates.create",
  UpdateServiceTemplate: "service-templates.update",
} as const;

export type CrmOperation = (typeof CrmOperation)[keyof typeof CrmOperation];

export const CRM_OPERATION_VALUES = [
  CrmOperation.ConvertLead,
  CrmOperation.ListCustomers,
  CrmOperation.CreateCustomer,
  CrmOperation.GetCustomer,
  CrmOperation.UpdateCustomer,
  CrmOperation.ListServiceTemplates,
  CrmOperation.CreateServiceTemplate,
  CrmOperation.UpdateServiceTemplate,
] as const;
