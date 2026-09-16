/** Accessibility wiring `FormField` hands to a custom control's render function. */
export type FormFieldControlBindings = {
  /** Space-separated hint/error ids, or undefined when neither is present. */
  describedBy?: string;
  /** True while the field has an error message. */
  invalid: boolean;
};
