/** A customer the feedback inbox can filter by. */
export interface FeedbackInboxCustomerDto {
  /** Customer identifier; the filter value in the URL. */
  id: string;
  /** Current customer name for the filter option. */
  displayName: string;
}
