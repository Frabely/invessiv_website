/**
 * A customer as offered when granting access. Deliberately carries nothing beyond identification:
 * the lookup is not scope-filtered, so it must never leak CRM content.
 */
export interface AccessCustomerOptionDto {
  /** `customers.id`; the value a grant addresses. */
  id: string;
  /** Number of the customer; format it in the view, never here. */
  customerNumber: number;
  /** Display name to recognise the customer by. */
  displayName: string;
}
