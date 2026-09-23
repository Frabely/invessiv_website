/** Customers and projects that have at least one task the current actor may read. */
export type TaskListFilterOptions = {
  customers: readonly {
    id: string;
    displayName: string;
  }[];
  projects: readonly {
    customerId: string;
    id: string;
    title: string;
  }[];
};
