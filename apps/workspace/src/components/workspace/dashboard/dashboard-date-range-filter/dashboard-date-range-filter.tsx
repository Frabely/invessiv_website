"use client";

import { useRouter } from "next/navigation";
import { DashboardQueryParam } from "@/common/constants/dashboard/dashboard-query-params";
import type { DateRangeFilterLabels } from "@/common/contracts/date-range-filter-labels";
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

  const pushOverride = (key: string, value: string | undefined) => {
    router.push(
      buildDashboardHref(basePath, currentQueryString, { [key]: value }),
      { scroll: false },
    );
  };

  return (
    <DateRangeFilter
      fromValue={fromValue}
      labels={labels}
      onFromChangeAction={(value) =>
        pushOverride(DashboardQueryParam.DateFrom, value)
      }
      onToChangeAction={(value) =>
        pushOverride(DashboardQueryParam.DateTo, value)
      }
      toValue={toValue}
    />
  );
}
