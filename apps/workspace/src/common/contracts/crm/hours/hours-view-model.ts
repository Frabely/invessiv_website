import type { CustomerHoursDto } from "@invessiv/common/contracts/crm/hours/customer-hours.dto";

/** What the cockpit needs to render the hours of one customer; the server already narrowed it. */
export type HoursViewModel = {
  hours: CustomerHoursDto;
  /** True only with `hours.manage` on the customer; every ledger action hangs on it. */
  canManage: boolean;
  /** Projects the actor may book time on; resolved with `canOn` per project on the server. */
  writableProjectIds: readonly string[];
  /** Minutes booked per task, goodwill included. A task without any entry has no key. */
  bookedMinutesByTaskId: Readonly<Record<string, number>>;
  /** Business day (Europe/Berlin): default and upper bound of every date field. */
  today: string;
};
