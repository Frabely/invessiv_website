import type { ServiceRequestAcceptFormValues } from "./service-request-accept-form-values";

export type ServiceRequestOfferReconciliation = {
  /** Form values with untouched defaults updated to the newly captured offer. */
  values: ServiceRequestAcceptFormValues;
  /** Preserved user edits differ from the new offer and need explicit acknowledgement. */
  requiresConfirmation: boolean;
};
