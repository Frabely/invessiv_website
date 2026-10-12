import { MINUTES_PER_HOUR } from "@invessiv/common/constants/time/time-units";

/** Bounds what a company can ask for through the portal and how much of its history it sees. */
export const PortalServiceRequestLimits = {
  /** Requests in `requested` or `offered` per company; a decided or withdrawn one frees a slot. */
  OpenPerCustomer: 10,
  /** A request starts at one whole hour, expressed in the API's minute unit. */
  MinRequestedMinutes: MINUTES_PER_HOUR,
  /** Largest amount of hours of a single request, in minutes. */
  MaxRequestedMinutes: 6000,
  /** Closed requests the dialog lists, newest first; every open request stays visible. */
  HistoryShown: 20,
} as const;

export type PortalServiceRequestLimit =
  (typeof PortalServiceRequestLimits)[keyof typeof PortalServiceRequestLimits];
