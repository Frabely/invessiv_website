"use client";

import { useRouter } from "next/navigation";
import { DashboardQueryParam } from "@/common/constants/dashboard/dashboard-query-params";
import { DateRangePreset } from "@/common/constants/date-range/date-range-presets";
import type { DateRangeChange } from "@/common/contracts/date-range/date-range-change";
import type { DateRangeFilterLabels } from "@/common/contracts/date-range/date-range-filter-labels";
import { DateRangeFilter } from "@/components/workspace/shared/date-range-filter/date-range-filter";
import { buildDashboardHref } from "@/lib/workspace/dashboard/dashboard-query-string";

type DashboardDateRangeFilterProps = {
  basePath: string;
  currentQueryString: string;
  fromValue: string;
  labels: DateRangeFilterLabels;
  toValue: string;
};

export function DashboardDateRangeFilter({
  basePath,
  currentQueryString,
  fromValue,
  labels,
  toValue,
}: DashboardDateRangeFilterProps) {
  const router = useRouter();
  const currentParams = new URLSearchParams(currentQueryString);
  const defaultPreset =
    currentParams.get(DashboardQueryParam.Range) === DateRangePreset.All
      ? DateRangePreset.All
      : DateRangePreset.Last7Days;

  function commitRange(change: DateRangeChange) {
    router.push(
      buildDashboardHref(basePath, currentQueryString, {
        [DashboardQueryParam.DateFrom]: change.from,
        [DashboardQueryParam.DateTo]: change.to,
        [DashboardQueryParam.Range]:
          change.preset === DateRangePreset.All
            ? DateRangePreset.All
            : undefined,
      }),
      { scroll: false },
    );
  }

  return (
    <DateRangeFilter
      defaultPreset={defaultPreset}
      fromValue={fromValue}
      key={`${defaultPreset}:${fromValue}:${toValue}`}
      labels={labels}
      onRangeChangeAction={commitRange}
      toValue={toValue}
    />
  );
}
