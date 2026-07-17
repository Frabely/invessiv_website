import { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";
import { MESSAGING_STAGE_ORDER } from "@/common/constants/dashboard/messaging-stage-order";
import { LEAD_STATUS_BADGE_TONES } from "@/common/constants/leads/badges/lead-status-badge-tones";
import type { MessagingConversionDto } from "@/common/contracts/dashboard/messaging-conversion.dto";
import type { MessagingConversionSpanRateDto } from "@/common/contracts/dashboard/messaging-conversion-span-rate.dto";
import type { Locale } from "@/config/i18n";
import type { DashboardMessagingDictionary } from "@/i18n/dictionaries/workspace/dashboard";
import { formatIntegerCount } from "../../../../lib/workspace/dashboard/format-integer";
import { FunnelConnector } from "../funnel-connector/funnel-connector";
import { FunnelStageCard } from "../funnel-stage-card/funnel-stage-card";
import styles from "./messaging-conversion-view.module.css";

const VALUE_PLACEHOLDER = "{value}";
const FROM_PLACEHOLDER = "{from}";
const TO_PLACEHOLDER = "{to}";
const RATE_PLACEHOLDER = "{rate}";
const RATIO_PLACEHOLDER = "{ratio}";

type MessagingConversionViewProps = {
  data: MessagingConversionDto;
  labels: DashboardMessagingDictionary;
  locale: Locale;
  title: string;
};

type MessagingSpanStage = (typeof MESSAGING_STAGE_ORDER)[2 | 3 | 4];

function toPercent(rate: number | null): number {
  return Math.round((rate ?? 0) * 100);
}

function formatPercentLabel(
  template: string,
  percent: number,
  locale: Locale,
): string {
  return template.replace(
    VALUE_PLACEHOLDER,
    formatIntegerCount(percent, locale),
  );
}

function formatStagePairLabel(
  template: string,
  fromLabel: string,
  toLabel: string,
): string {
  return template
    .replace(FROM_PLACEHOLDER, fromLabel)
    .replace(TO_PLACEHOLDER, toLabel);
}

function formatTransitionAriaLabel(
  template: string,
  fromLabel: string,
  toLabel: string,
  rate: number,
  fromCount: number,
  toCount: number,
  locale: Locale,
  rateTemplate: string,
): string {
  const rateLabel = formatPercentLabel(rateTemplate, toPercent(rate), locale);
  const ratioLabel = `${formatIntegerCount(toCount, locale)} / ${formatIntegerCount(fromCount, locale)}`;

  return formatStagePairLabel(template, fromLabel, toLabel)
    .replace(RATE_PLACEHOLDER, rateLabel)
    .replace(RATIO_PLACEHOLDER, ratioLabel);
}

export function MessagingConversionView({
  data,
  labels,
  locale,
  title,
}: MessagingConversionViewProps) {
  const firstStepCount = data.steps[0]?.count ?? 0;

  const renderSpanRow = (
    spanRate: MessagingConversionSpanRateDto,
    status: MessagingSpanStage,
    index: number,
  ) => {
    const fromLabel = labels.stageLabels[ContactLeadStatus.Contacted];
    const toLabel = labels.stageLabels[status];

    return (
      <div className={styles.spanRow} data-span={status}>
        <span aria-hidden="true" className={styles.spanLabel}>
          {formatStagePairLabel(labels.directRateLabel, fromLabel, toLabel)}
        </span>
        <FunnelConnector
          ariaLabel={formatTransitionAriaLabel(
            labels.transitionAriaLabel,
            fromLabel,
            toLabel,
            spanRate.rate,
            spanRate.fromCount,
            spanRate.toCount,
            locale,
            labels.ratePercent,
          )}
          index={index}
          locale={locale}
          nextCount={spanRate.toCount}
          nextStageTone={LEAD_STATUS_BADGE_TONES[status]}
          percentLabel={formatPercentLabel(
            labels.ratePercent,
            toPercent(spanRate.rate),
            locale,
          )}
          previousCount={spanRate.fromCount}
          previousStageTone={
            LEAD_STATUS_BADGE_TONES[ContactLeadStatus.Contacted]
          }
          showAreaFade
        />
      </div>
    );
  };

  return (
    <section
      aria-labelledby="messaging-conversion-title"
      className={styles.card}
    >
      <header className={styles.header}>
        <h2 className={styles.title} id="messaging-conversion-title">
          {title}
        </h2>
      </header>

      <ol className={styles.track} role="list">
        {data.steps.map((step, index) => {
          const nextStep =
            index < data.steps.length - 1 ? data.steps[index + 1] : null;
          const nextKey = nextStep?.key ?? null;
          const stageLabel = labels.stageLabels[step.key];
          const formattedCount = formatIntegerCount(step.count, locale);
          const stageShareRatio =
            firstStepCount === 0 ? 0 : Math.min(step.count / firstStepCount, 1);
          const stagePercent = toPercent(stageShareRatio);

          return (
            <li className={styles.stepItem} key={step.key}>
              <FunnelStageCard
                ariaLabel={`${stageLabel} - ${formattedCount} ${labels.stageCountAriaSuffix}`}
                countLabel={formattedCount}
                index={index}
                shareLabel={formatPercentLabel(
                  labels.ratePercent,
                  stagePercent,
                  locale,
                )}
                shareRatio={stageShareRatio}
                status={step.key}
                statusLabel={stageLabel}
              />

              {nextStep !== null &&
              nextKey !== null &&
              nextKey !== ContactLeadStatus.Contacted ? (
                <FunnelConnector
                  ariaLabel={formatTransitionAriaLabel(
                    labels.transitionAriaLabel,
                    stageLabel,
                    labels.stageLabels[nextKey],
                    nextStep.rateFromPrev ?? 0,
                    step.count,
                    nextStep.count,
                    locale,
                    labels.ratePercent,
                  )}
                  index={index}
                  locale={locale}
                  nextCount={nextStep.count}
                  nextStageTone={LEAD_STATUS_BADGE_TONES[nextKey]}
                  percentLabel={formatPercentLabel(
                    labels.ratePercent,
                    toPercent(nextStep.rateFromPrev),
                    locale,
                  )}
                  previousCount={step.count}
                  previousStageTone={LEAD_STATUS_BADGE_TONES[step.key]}
                />
              ) : null}
            </li>
          );
        })}
      </ol>

      <div className={styles.spans}>
        {renderSpanRow(
          data.contactedToSetting,
          ContactLeadStatus.SettingCall,
          5,
        )}
        {renderSpanRow(
          data.contactedToClosing,
          ContactLeadStatus.ClosingCall,
          6,
        )}
        {renderSpanRow(data.contactedToWon, ContactLeadStatus.Won, 7)}
      </div>
    </section>
  );
}
