import type { LineItemFieldsFormValues } from "./line-item-fields-form-values";

export type ServiceRequestOfferFormValues = LineItemFieldsFormValues & {
  /** Offered hours as typed; unused for every other kind. */
  quantityInput: string;
};
