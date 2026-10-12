import { ServiceRequestStatus as S } from "./service-request-statuses";
import { ServiceRequestTransitionSide as Side } from "./service-request-transition-sides";
export const SERVICE_REQUEST_TRANSITIONS = [
  { from: S.Requested, to: S.Offered, side: Side.Internal },
  { from: S.Requested, to: S.Accepted, side: Side.Internal },
  { from: S.Requested, to: S.Declined, side: Side.Internal },
  { from: S.Offered, to: S.Accepted, side: Side.Internal },
  { from: S.Offered, to: S.Declined, side: Side.Internal },
  { from: S.Requested, to: S.Withdrawn, side: Side.Customer },
] as const;
