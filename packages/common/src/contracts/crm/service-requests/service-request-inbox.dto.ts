import type { ServiceRequestDto } from "./service-request.dto";
export interface ServiceRequestInboxDto {
  /** Requests of the served page only, within the actor's customer scope. */
  items: ServiceRequestDto[];
  /** The page actually served; a requested page beyond the end clamps to the last one. */
  page: number;
  /** Rows per page, fixed by the server. */
  perPage: number;
  /** All requests matching the active filter, not only this page. */
  total: number;
  /** True if any request exists regardless of the active filter. */
  hasRequests: boolean;
}
