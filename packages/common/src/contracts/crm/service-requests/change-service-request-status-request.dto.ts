import type { ServiceRequestStatus } from "@invessiv/common/constants/crm/service-request-statuses";
export type ChangeServiceRequestStatusRequestDto =
  | {
      /** Mark the offer as sent. */
      to: typeof ServiceRequestStatus.Offered;
      /** Expected request version. */
      version: number;
    }
  | {
      /** Reject the request. */
      to: typeof ServiceRequestStatus.Declined;
      /** Expected request version. */
      version: number;
      /** Customer-visible rejection reason. */
      reason: string;
    };
