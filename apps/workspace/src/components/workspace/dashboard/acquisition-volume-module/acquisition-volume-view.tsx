import type { AcquisitionVolumeDto } from "@/common/contracts/dashboard/acquisition-volume.dto";
import type { KpiCardComparison } from "@/common/contracts/dashboard/kpi-card-comparison";
import type { Locale } from "@/config/i18n";
import type { DashboardAcquisitionVolumeDictionary } from "@/i18n/dictionaries/workspace/dashboard";
import { calculateKpiDelta } from "@/lib/workspace/dashboard/calculate-kpi-delta";
import { KpiCard } from "../kpi-card/kpi-card";

const INTEGER_FRACTION_DIGITS = 0;
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

function formatInteger(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: INTEGER_FRACTION_DIGITS,
  }).format(value);
}

function formatPercent(
  percent: number,
  locale: Locale,
  template: string,
): string {
  const formattedNumber = new Intl.NumberFormat(locale, {
    maximumFractionDigits: PERCENT_FRACTION_DIGITS,
    minimumFractionDigits: INTEGER_FRACTION_DIGITS,
    signDisplay: "exceptZero",
  }).format(percent);
  return template.replace(PERCENT_PLACEHOLDER, formattedNumber);
}

function buildComparison(
  data: AcquisitionVolumeDto,
  labels: DashboardAcquisitionVolumeDictionary,
  locale: Locale,
): KpiCardComparison {
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
      formatInteger(data.previous, locale),
    ),
  };
}

export function AcquisitionVolumeView({
  data,
  labels,
  locale,
  title,
}: AcquisitionVolumeViewProps) {
  const value = formatInteger(data.current, locale);
  const comparison = buildComparison(data, labels, locale);

  const badge =
    data.pendingReview > 0
      ? labels.pendingReviewBadge.replace(
          PENDING_REVIEW_PLACEHOLDER,
          formatInteger(data.pendingReview, locale),
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
