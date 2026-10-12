import type { ServiceRequestDto } from "./service-request.dto";
export interface ServiceRequestInboxDto {
  /** Requests within the actor's customer scope. */
  items: ServiceRequestDto[];
  /** True if any request exists regardless of the active filter. */
  hasRequests: boolean;
}
