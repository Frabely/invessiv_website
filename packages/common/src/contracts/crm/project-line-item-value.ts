/** Revenue values in EUR cents derived from confirmed project line items. */
export type ProjectLineItemValue = {
  /** Sum of confirmed one-time items. */
  oneTimeCents: number;
  /** Sum of confirmed monthly recurring items. */
  monthlyCents: number;
};
