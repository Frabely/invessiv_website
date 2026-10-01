/**
 * The DOM id of the control that receives the focus for a field: its input, or the first option
 * of a choice. Field components set it, the jump from the list of missing answers looks it up.
 */
export function onboardingFieldDomId(fieldId: string): string {
  return `onboarding-field-${fieldId}`;
}
