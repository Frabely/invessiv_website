import { DashboardRangeKind } from "@/common/constants/dashboard/dashboard-range-kinds";

type BoundedRangeSelection = {
  kind: typeof DashboardRangeKind.Bounded;
  from: Date;
  to: Date;
  previousFrom: Date;
  previousTo: Date;
  fromInputValue: string;
  toInputValue: string;
};

type AllRangeSelection = {
  kind: typeof DashboardRangeKind.All;
  fromInputValue: "";
  toInputValue: "";
};

export type RangeSelection = BoundedRangeSelection | AllRangeSelection;
