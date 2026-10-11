/** The sort position of one time entry: day, booking instant (to the millisecond) and id. */
export type TimeEntryCursor = {
  performedOn: string;
  createdAt: string;
  id: string;
};
