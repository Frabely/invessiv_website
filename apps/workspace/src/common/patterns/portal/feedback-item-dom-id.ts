/** Stable anchor of an item's heading, so jump links survive reordering and renumbering. */
export function feedbackItemDomId(itemId: string): string {
  return `feedback-item-${itemId}`;
}
