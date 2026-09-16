/** Accessibility wiring `FormField` hands to a custom control's render function. */
export type FormFieldControlBindings = {
  /** Space-separated hint/error ids, or undefined when neither is present. */
  describedBy?: string;
  /** Stable id that associates the rendered control with the field label. */
  id: string;
  /** True while the field has an error message. */
  invalid: boolean;
};
