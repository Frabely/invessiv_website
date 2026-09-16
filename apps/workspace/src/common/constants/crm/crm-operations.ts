/** Stable operation names for CRM route logs; never contain ids, names or emails. */
export const CrmOperation = {
  ListCustomers: "customers.list",
  GetCustomer: "customers.get",
  CreateCustomer: "customers.create",
  UpdateCustomer: "customers.update",
} as const;

export type CrmOperation = (typeof CrmOperation)[keyof typeof CrmOperation];

export const CRM_OPERATION_VALUES = [
  CrmOperation.ListCustomers,
  CrmOperation.GetCustomer,
  CrmOperation.CreateCustomer,
  CrmOperation.UpdateCustomer,
] as const;
