/**
 * The DOM id of the control that receives the focus for a slot: its input, the first option of a
 * choice, the add button of a group. Field components set it, the jump from the list of missing
 * answers looks it up. The slot key keeps the same sub-field apart per group entry.
 */
export function onboardingFieldDomId(slotKey: string): string {
  return `onboarding-field-${slotKey}`;
}
