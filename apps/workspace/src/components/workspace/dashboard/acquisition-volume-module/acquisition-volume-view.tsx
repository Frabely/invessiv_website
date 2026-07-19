import type { AcquisitionVolumeDto } from "@/common/contracts/dashboard/acquisition-volume.dto";
import type { KpiCardComparison } from "@/common/contracts/dashboard/kpi-card-comparison";
import { KpiTrend } from "@/common/constants/dashboard/kpi-trend";
import type { Locale } from "@/config/i18n";
import type { DashboardAcquisitionVolumeDictionary } from "@/i18n/dictionaries/workspace/dashboard";
import { calculateKpiDelta } from "@/lib/workspace/dashboard/calculate-kpi-delta";
import { formatIntegerCount } from "@/lib/workspace/dashboard/format-integer";
import { KpiCard } from "../kpi-card/kpi-card";

const PERCENT_FRACTION_DIGITS = 1;
const PREVIOUS_PLACEHOLDER = "{previous}";
const PERCENT_PLACEHOLDER = "{value}";
const PENDING_REVIEW_PLACEHOLDER = "{count}";

type AcquisitionVolumeViewProps = {
  data: AcquisitionVolumeDto;
  labels: DashboardAcquisitionVolumeDictionary;
  locale: Locale;
  title: string;
};

function formatPercent(
  percent: number,
  locale: Locale,
  template: string,
): string {
  const formattedNumber = new Intl.NumberFormat(locale, {
    maximumFractionDigits: PERCENT_FRACTION_DIGITS,
    minimumFractionDigits: 0,
    signDisplay: "exceptZero",
  }).format(percent);
  return template.replace(PERCENT_PLACEHOLDER, formattedNumber);
}

function buildComparison(
  data: AcquisitionVolumeDto,
  labels: DashboardAcquisitionVolumeDictionary,
  locale: Locale,
): KpiCardComparison {
  if (data.previous === null) {
    return {
      trend: KpiTrend.Flat,
      formattedDelta: labels.comparisonFormat.noData,
      description: labels.comparisonNoPriorData,
    };
  }

  const delta = calculateKpiDelta(data.current, data.previous);

  if (delta.deltaPercent === null) {
    return {
      trend: delta.trend,
      formattedDelta: labels.comparisonFormat.noData,
      description: labels.comparisonNoPriorData,
    };
  }

  return {
    trend: delta.trend,
    formattedDelta: formatPercent(
      delta.deltaPercent,
      locale,
      labels.comparisonFormat.percent,
    ),
    description: labels.comparisonDescription.replace(
      PREVIOUS_PLACEHOLDER,
      formatIntegerCount(data.previous, locale),
    ),
  };
}

export function AcquisitionVolumeView({
  data,
  labels,
  locale,
  title,
}: AcquisitionVolumeViewProps) {
  const value = formatIntegerCount(data.current, locale);
  const comparison = buildComparison(data, labels, locale);

  const badge =
    data.pendingReview > 0
      ? labels.pendingReviewBadge.replace(
          PENDING_REVIEW_PLACEHOLDER,
          formatIntegerCount(data.pendingReview, locale),
        )
      : undefined;

  return (
    <KpiCard
      badge={badge}
      comparison={comparison}
      subText={labels.subText}
      title={title}
      value={value}
    />
  );
}
