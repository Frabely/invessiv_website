/** Stable operation names for CRM route logs; never contain ids, names or emails. */
export const CrmOperation = {
  ConvertLead: "leads.convert",
  ListCustomers: "customers.list",
  CreateCustomer: "customers.create",
  UpdateCustomer: "customers.update",
} as const;

export type CrmOperation = (typeof CrmOperation)[keyof typeof CrmOperation];

export const CRM_OPERATION_VALUES = [
  CrmOperation.ConvertLead,
  CrmOperation.ListCustomers,
  CrmOperation.CreateCustomer,
  CrmOperation.UpdateCustomer,
] as const;
