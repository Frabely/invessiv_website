/** Where a link into a form points: a step and optionally a field of it. */
export interface PortalOnboardingStepTarget {
  /** Block id of the step, or the review step; the first step when left out. */
  section?: string;
  /** Field that receives the focus once the step is shown. */
  fieldId?: string;
}
