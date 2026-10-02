/** Wording of the read-only answers; portal and CRM pass their own dictionary section. */
export interface OnboardingReadTexts {
  /** Shown for a visible required field without an answer. */
  unanswered: string;
  /** Shown for an optional field without an answer. */
  empty: string;
  /** Accessible name of the required marker. */
  required: string;
  /** Shown for a ticked confirmation. */
  confirmed: string;
  /** A level of a scale; takes `{step}` and `{max}`. */
  scale: string;
  /** Heading of one group entry; takes `{number}`. */
  entry: string;
  /** Shown for a group without entries. */
  noEntries: string;
  /** Names the file list of a field; takes `{field}`. */
  filesLabel: string;
  /** Shown once the customer confirmed the booked services. */
  servicesConfirmed: string;
  /** Shown while the booked services are not confirmed. */
  servicesNotConfirmed: string;
  /** Label of the remark the customer left with the confirmation. */
  servicesNote: string;
  /** Shown when the project has no booked services. */
  servicesEmpty: string;
}
