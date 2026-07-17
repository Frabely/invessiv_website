import { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";
import { MESSAGING_STAGE_ORDER } from "@/common/constants/dashboard/messaging-stage-order";
import type { MessagingConversionDto } from "@/common/contracts/dashboard/messaging-conversion.dto";
import type { MessagingConversionSpanRateDto } from "@/common/contracts/dashboard/messaging-conversion-span-rate.dto";
import type { Locale } from "@/config/i18n";
import type { DashboardMessagingDictionary } from "@/i18n/dictionaries/workspace/dashboard";
import { formatIntegerCount } from "../../../../lib/workspace/dashboard/format-integer";
import { getLeadStatusBadgeTone } from "../../leads/shared/lead-status-badge/lead-status-badge";
import { FunnelConnector } from "../funnel-connector/funnel-connector";
import { FunnelStageCard } from "../funnel-stage-card/funnel-stage-card";
import styles from "./messaging-conversion-view.module.css";

const VALUE_PLACEHOLDER = "{value}";

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
  ) => (
    <div className={styles.spanRow} data-span={status}>
      <FunnelConnector
        ariaLabel={labels.connectorAriaLabel}
        index={index}
        locale={locale}
        nextCount={spanRate.toCount}
        nextStageTone={getLeadStatusBadgeTone(status)}
        previousCount={spanRate.fromCount}
        previousStageTone={getLeadStatusBadgeTone(ContactLeadStatus.Contacted)}
        showAreaFade
      />
    </div>
  );

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
                  ariaLabel={labels.connectorAriaLabel}
                  index={index}
                  locale={locale}
                  nextCount={nextStep.count}
                  nextStageTone={getLeadStatusBadgeTone(nextKey)}
                  previousCount={step.count}
                  previousStageTone={getLeadStatusBadgeTone(step.key)}
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
