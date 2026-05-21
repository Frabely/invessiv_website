"use client";

import { useRouter } from "next/navigation";
import { DashboardQueryParam } from "@/common/constants/dashboard/dashboard-query-params";
import type { DateRangeFilterLabels } from "@/common/contracts/date-range-filter-labels";
import { DateRangeFilter } from "@/components/workspace/shared/date-range-filter/date-range-filter";
import {
  buildDashboardHref,
  type DashboardHrefOverrides,
} from "@/lib/workspace/dashboard/dashboard-query-string";

type DashboardDateRangeFilterProps = {
  basePath: string;
  currentQueryString: string;
  fromValue: string;
  labels: DateRangeFilterLabels;
  toValue: string;
};

type DateRangeKey =
  | typeof DashboardQueryParam.DateFrom
  | typeof DashboardQueryParam.DateTo;

function buildDateRangeOverride(
  key: DateRangeKey,
  value: string | undefined,
  fromValue: string,
  toValue: string,
): DashboardHrefOverrides {
  if (key === DashboardQueryParam.DateFrom) {
    if (!value) {
      return {
        [DashboardQueryParam.DateFrom]: undefined,
        [DashboardQueryParam.DateTo]: toValue || undefined,
      };
    }

    if (toValue && value > toValue) {
      return {
        [DashboardQueryParam.DateFrom]: value,
        [DashboardQueryParam.DateTo]: value,
      };
    }

    return {
      [DashboardQueryParam.DateFrom]: value,
      [DashboardQueryParam.DateTo]: toValue || undefined,
    };
  }

  if (!value) {
    return {
      [DashboardQueryParam.DateFrom]: fromValue || undefined,
      [DashboardQueryParam.DateTo]: undefined,
    };
  }

  if (fromValue && value < fromValue) {
    return {
      [DashboardQueryParam.DateFrom]: value,
      [DashboardQueryParam.DateTo]: value,
    };
  }

  return {
    [DashboardQueryParam.DateFrom]: fromValue || undefined,
    [DashboardQueryParam.DateTo]: value,
  };
}

export function DashboardDateRangeFilter({
  basePath,
  currentQueryString,
  fromValue,
  labels,
  toValue,
}: DashboardDateRangeFilterProps) {
  const router = useRouter();

  const pushOverride = (key: DateRangeKey, value: string | undefined) => {
    const normalizedValue = value ?? "";
    const currentValue =
      key === DashboardQueryParam.DateFrom ? fromValue : toValue;
    if (normalizedValue === currentValue) {
      return;
    }

    const overrides = buildDateRangeOverride(key, value, fromValue, toValue);

    router.push(buildDashboardHref(basePath, currentQueryString, overrides), {
      scroll: false,
    });
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
