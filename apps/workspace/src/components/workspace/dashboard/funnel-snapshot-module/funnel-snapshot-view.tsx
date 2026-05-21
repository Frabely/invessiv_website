import { faArrowRightLong } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { CSSProperties } from "react";
import { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";
import { LeadStatusBadge } from "@/components/workspace/leads/shared/lead-status-badge/lead-status-badge";
import type { FunnelSnapshotDto } from "@/common/contracts/dashboard/funnel-snapshot.dto";
import type { Locale } from "@/config/i18n";
import type { DashboardFunnelDictionary } from "@/i18n/dictionaries/workspace/dashboard";
import { formatIntegerCount } from "@/lib/workspace/dashboard/format-integer";
import styles from "./funnel-snapshot-view.module.css";

const PERCENT_PLACEHOLDER = "{value}";
const COUNT_PLACEHOLDER = "{count}";
const LABEL_PLACEHOLDER = "{label}";

type FunnelSnapshotViewProps = {
  data: FunnelSnapshotDto;
  labels: DashboardFunnelDictionary;
  locale: Locale;
  title: string;
};

function formatPercentFromRatio(
  ratio: number,
  locale: Locale,
  template: string,
): string {
  const percentValue = Math.round(ratio * 100);
  const formattedNumber = formatIntegerCount(percentValue, locale);
  return template.replace(PERCENT_PLACEHOLDER, formattedNumber);
}

export function FunnelSnapshotView({
  data,
  labels,
  locale,
  title,
}: FunnelSnapshotViewProps) {
  const stages = data.stages;
  const outcomes = data.outcomes;
  const totalCount = data.totalCount;
  const inactiveOutcomeCount = outcomes.reduce(
    (sum, outcome) => sum + outcome.count,
    0,
  );
  const pipelineCount = Math.max(totalCount - inactiveOutcomeCount, 0);
  const formattedTotalCount = formatIntegerCount(totalCount, locale);

  return (
    <section aria-labelledby="funnel-snapshot-title" className={styles.card}>
      <header className={styles.header}>
        <h2 className={styles.title} id="funnel-snapshot-title">
          {title}
        </h2>
        <div className={styles.headerMetrics}>
          <span className={styles.totalCount}>
            <span className={styles.totalCountLabel}>{labels.total.label}</span>
            <span className={styles.totalCountValue}>
              {formattedTotalCount}
            </span>
          </span>
          <div className={styles.outcomes}>
            {outcomes.map((outcome) => {
              const formattedOutcomeCount = formatIntegerCount(
                outcome.count,
                locale,
              );
              const outcomeRatio =
                totalCount === 0 ? null : outcome.count / totalCount;
              const formattedOutcomePercent =
                outcomeRatio === null
                  ? labels.dropOff.noData
                  : formatPercentFromRatio(
                      outcomeRatio,
                      locale,
                      labels.outcome.percent,
                    );

              return (
                <span
                  aria-label={labels.outcome.ariaLabel
                    .replace(LABEL_PLACEHOLDER, labels.stageLabels[outcome.key])
                    .replace(COUNT_PLACEHOLDER, formattedOutcomeCount)
                    .replace(PERCENT_PLACEHOLDER, formattedOutcomePercent)}
                  className={styles.outcome}
                  data-outcome={outcome.key}
                  key={outcome.key}
                >
                  <LeadStatusBadge
                    className={styles.outcomeBadge}
                    label={labels.stageLabels[outcome.key]}
                    status={outcome.key}
                  />
                  <span className={styles.outcomeValue}>
                    {formattedOutcomeCount}
                  </span>
                  <span className={styles.outcomePercent}>
                    {formattedOutcomePercent}
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      </header>

      <ol className={styles.track} role="list">
        {stages.map((stage, index) => {
          const nextStage =
            index < stages.length - 1 ? stages[index + 1] : null;
          const stageLabel = labels.stageLabels[stage.key];
          const stageDescription = labels.stageDescriptions[stage.key];
          const formattedCount = formatIntegerCount(stage.count, locale);
          const pendingReviewCount = stage.pendingReviewCount ?? 0;
          const pipelineShareRatio =
            pipelineCount === 0
              ? null
              : Math.min(stage.count / pipelineCount, 1);

          return (
            <li className={styles.stageItem} key={stage.key}>
              <article
                aria-label={`${stageLabel} stage - ${formattedCount} ${labels.stageCountAriaSuffix}`}
                className={styles.stageCard}
                data-stage={stage.key}
                role="group"
                style={
                  {
                    "--stage-share":
                      pipelineShareRatio === null
                        ? "0%"
                        : `${pipelineShareRatio * 100}%`,
                    "--stage-delay": `${0.08 + index * 0.1}s`,
                  } as CSSProperties
                }
              >
                <span aria-hidden="true" className={styles.stageAccent} />
                <div className={styles.stageTop}>
                  <LeadStatusBadge
                    className={styles.stageBadge}
                    label={stageLabel}
                    status={stage.key}
                  />
                </div>

                <div className={styles.stageBody}>
                  <span className={styles.stageValue}>{formattedCount}</span>
                  {stage.key === ContactLeadStatus.New &&
                  pendingReviewCount > 0 ? (
                    <span className={styles.stageInlineNote}>
                      {labels.pendingReview.format.replace(
                        COUNT_PLACEHOLDER,
                        formatIntegerCount(pendingReviewCount, locale),
                      )}
                    </span>
                  ) : null}
                </div>

                <div className={styles.stageShareRow}>
                  <div
                    aria-hidden="true"
                    className={styles.stageBarTrack}
                    data-empty={pipelineShareRatio === null ? "true" : "false"}
                  >
                    <span className={styles.stageBarFill} />
                  </div>
                  <span className={styles.stageShareLabel}>
                    {pipelineShareRatio === null
                      ? labels.dropOff.noData
                      : formatPercentFromRatio(
                          pipelineShareRatio,
                          locale,
                          labels.pipelineShare,
                        )}
                  </span>
                </div>

                <p className={styles.stageDescription}>{stageDescription}</p>
              </article>

              {nextStage !== null ? (
                <FunnelConnector
                  ariaLabel={labels.connectorAriaLabel}
                  dropOff={nextStage.dropOffFromPrev}
                  forwardedTemplate={labels.dropOff.forwarded}
                  index={index}
                  locale={locale}
                  noDataDescription={labels.dropOff.noDataDescription}
                  noDataLabel={labels.dropOff.noData}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

type FunnelConnectorProps = {
  ariaLabel: string;
  dropOff: number | null;
  forwardedTemplate: string;
  index: number;
  locale: Locale;
  noDataDescription: string;
  noDataLabel: string;
};

function FunnelConnector({
  ariaLabel,
  dropOff,
  forwardedTemplate,
  index,
  locale,
  noDataDescription,
  noDataLabel,
}: FunnelConnectorProps) {
  const hasData = dropOff !== null;
  const formattedForwarded = hasData
    ? formatPercentFromRatio(dropOff, locale, forwardedTemplate)
    : noDataLabel;

  return (
    <div
      aria-label={ariaLabel}
      className={styles.connector}
      data-has-data={hasData ? "true" : "false"}
      data-slot="funnel-connector"
      role="presentation"
      style={
        {
          "--connector-delay": `${0.18 + index * 0.1}s`,
        } as CSSProperties
      }
    >
      <div className={styles.connectorLabel}>
        <span aria-hidden="true" className={styles.connectorChevron}>
          <FontAwesomeIcon icon={faArrowRightLong} />
        </span>
        <span className={styles.connectorPercent}>{formattedForwarded}</span>
        {!hasData ? (
          <span className={styles.connectorNoDataDescription}>
            {noDataDescription}
          </span>
        ) : null}
      </div>
    </div>
  );
}
