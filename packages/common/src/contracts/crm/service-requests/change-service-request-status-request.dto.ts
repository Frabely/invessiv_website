import type { ServiceRequestStatus } from "@invessiv/common/constants/crm/service-request-statuses";
export type ChangeServiceRequestStatusRequestDto =
  | {
      /** Mark the offer as sent. */
      to: typeof ServiceRequestStatus.Offered;
      /** Expected request version. */
      version: number;
      /** Offered price in cents; the hourly rate for an hours request. Internal, never shown in the portal. */
      priceCents: number;
      /** Offered hours in minutes; set exactly for an hours request. */
      minutes: number | null;
    }
  | {
      /** Reject the request. */
      to: typeof ServiceRequestStatus.Declined;
      /** Expected request version. */
      version: number;
      /** Customer-visible rejection reason. */
      reason: string;
    }
  | {
      /** Record that the customer turned the offer down. */
      to: typeof ServiceRequestStatus.Withdrawn;
      /** Expected request version. */
      version: number;
    };
