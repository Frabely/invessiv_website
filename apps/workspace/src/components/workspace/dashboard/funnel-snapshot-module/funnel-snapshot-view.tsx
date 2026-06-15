import { faArrowRightLong } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { CSSProperties } from "react";
import { ContactLeadStatus } from "@invessiv/common/constants/contact/contact-lead-statuses";
import { getLeadStatusBadgeTone } from "../../leads/shared/lead-status-badge/lead-status-badge";
import {
  FunnelInsightKind,
  type FunnelInsightKind as FunnelInsightKindValue,
} from "../../../../common/constants/dashboard/funnel-insight-kind";
import { LeadStatusBadge } from "../../leads/shared";
import type { FunnelSnapshotDto } from "@/common/contracts/dashboard/funnel-snapshot.dto";
import type { Locale } from "@/config/i18n";
import type { DashboardFunnelDictionary } from "@/i18n/dictionaries/workspace/dashboard";
import { formatIntegerCount } from "../../../../lib/workspace/dashboard/format-integer";
import { FunnelConnector } from "./funnel-connector";
import styles from "./funnel-snapshot-view.module.css";

const PERCENT_PLACEHOLDER = "{value}";
const COUNT_PLACEHOLDER = "{count}";
const LABEL_PLACEHOLDER = "{label}";
const FROM_PLACEHOLDER = "{from}";
const TO_PLACEHOLDER = "{to}";
const DROP_PLACEHOLDER = "{drop}";
const STAGE_PLACEHOLDER = "{stage}";

type FunnelSnapshotViewProps = {
  data: FunnelSnapshotDto;
  labels: DashboardFunnelDictionary;
  locale: Locale;
  title: string;
};

type FunnelStageKey = FunnelSnapshotDto["stages"][number]["key"];

type FunnelStepInsight = {
  fromKey: FunnelStageKey;
  toKey: FunnelStageKey;
  fromCount: number;
  toCount: number;
  conversionPercent: number;
  dropCount: number;
};

type FunnelInsight = {
  kind: FunnelInsightKindValue;
  stage: FunnelStepInsight;
} | null;

function formatPercentFromRatio(
  ratio: number,
  locale: Locale,
  template: string,
): string {
  const percentValue = Math.round(ratio * 100);
  const formattedNumber = formatIntegerCount(percentValue, locale);
  return template.replace(PERCENT_PLACEHOLDER, formattedNumber);
}

function buildTransitionInsights(
  stages: ReadonlyArray<FunnelSnapshotDto["stages"][number]>,
): {
  largestDropOff: FunnelStepInsight | null;
  weakestConversion: FunnelStepInsight | null;
} {
  let largestDropOff: FunnelStepInsight | null = null;
  let weakestConversion: FunnelStepInsight | null = null;

  for (let index = 0; index < stages.length - 1; index += 1) {
    const currentStage = stages[index];
    const nextStage = stages[index + 1];

    if (!currentStage || !nextStage) {
      continue;
    }

    const fromCount = currentStage.count;
    const toCount = nextStage.count;
    const dropCount = Math.max(fromCount - toCount, 0);
    const conversionPercent =
      fromCount <= 0 ? 0 : Math.round((toCount / fromCount) * 100);
    const insight: FunnelStepInsight = {
      fromKey: currentStage.key,
      toKey: nextStage.key,
      fromCount,
      toCount,
      conversionPercent,
      dropCount,
    };

    if (
      largestDropOff === null ||
      insight.dropCount > largestDropOff.dropCount ||
      (insight.dropCount === largestDropOff.dropCount &&
        insight.conversionPercent < largestDropOff.conversionPercent)
    ) {
      largestDropOff = insight;
    }

    if (
      fromCount > 0 &&
      (weakestConversion === null ||
        insight.conversionPercent < weakestConversion.conversionPercent ||
        (insight.conversionPercent === weakestConversion.conversionPercent &&
          insight.dropCount > weakestConversion.dropCount))
    ) {
      weakestConversion = insight;
    }
  }

  return { largestDropOff, weakestConversion };
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
  const formattedPipelineCount = formatIntegerCount(pipelineCount, locale);
  const transitionInsights = buildTransitionInsights(stages);

  const insight: FunnelInsight =
    transitionInsights.largestDropOff !== null &&
    transitionInsights.largestDropOff.dropCount > 0
      ? {
          kind: FunnelInsightKind.Drop,
          stage: transitionInsights.largestDropOff,
        }
      : transitionInsights.weakestConversion !== null
        ? {
            kind: FunnelInsightKind.Conversion,
            stage: transitionInsights.weakestConversion,
          }
        : null;

  return (
    <section aria-labelledby="funnel-snapshot-title" className={styles.card}>
      <header className={styles.header}>
        <h2 className={styles.title} id="funnel-snapshot-title">
          {title}
        </h2>
        <div className={styles.headerMetrics}>
          <div className={styles.summaryLine}>
            <span className={styles.summaryPrimary}>
              <span className={styles.summaryPrimaryLabel}>
                {labels.summary.activePipeline}
              </span>
              <span className={styles.summaryPrimaryValue}>
                {formattedPipelineCount}
              </span>
            </span>
            <span className={styles.summarySecondary}>
              {labels.summary.total.replace(
                COUNT_PLACEHOLDER,
                formattedTotalCount,
              )}
            </span>
            <span className={styles.summarySecondary}>
              {labels.summary.excluded.replace(
                COUNT_PLACEHOLDER,
                formatIntegerCount(inactiveOutcomeCount, locale),
              )}
            </span>
          </div>

          <div className={styles.summaryOutcomes}>
            {outcomes.map((outcome) => {
              const formattedOutcomeCount = formatIntegerCount(
                outcome.count,
                locale,
              );

              return (
                <LeadStatusBadge
                  className={styles.summaryOutcomeBadge}
                  key={outcome.key}
                  label={labels.summary.outcomeLabel
                    .replace(COUNT_PLACEHOLDER, formattedOutcomeCount)
                    .replace(
                      LABEL_PLACEHOLDER,
                      labels.stageLabels[outcome.key],
                    )}
                  status={outcome.key}
                />
              );
            })}
          </div>
        </div>
      </header>

      <ol className={styles.track} role="list">
        {stages.map((stage, index) => {
          const nextStage =
            index < stages.length - 1 ? stages[index + 1] : null;
          const previousStage = index > 0 ? stages[index - 1] : null;
          const previousStageLabel =
            previousStage === null
              ? null
              : labels.stageLabels[previousStage.key];
          const stageLabel = labels.stageLabels[stage.key];
          const stageDescription = labels.stageDescriptions[stage.key];
          const formattedCount = formatIntegerCount(stage.count, locale);
          const stageTone = getLeadStatusBadgeTone(stage.key);
          const pendingReviewCount = stage.pendingReviewCount ?? 0;
          const pipelineShareRatio =
            pipelineCount === 0
              ? null
              : Math.min(stage.count / pipelineCount, 1);
          const stageConversionRatio =
            index === 0
              ? 1
              : previousStage === null || previousStage.count === 0
                ? 0
                : stage.count / previousStage.count;
          const shareLabel =
            index === 0
              ? labels.pipelineShareRoot
              : labels.pipelineShareFromPrev.replace(
                  STAGE_PLACEHOLDER,
                  previousStageLabel ?? "",
                );

          return (
            <li className={styles.stageItem} key={stage.key}>
              <article
                aria-label={`${stageLabel} stage - ${formattedCount} ${labels.stageCountAriaSuffix}`}
                className={styles.stageCard}
                data-stage={stage.key}
                data-tone={stageTone}
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
                      <span className={styles.stageInlineNotePrefix}>
                        {labels.pendingReview.prefix}
                      </span>
                      <LeadStatusBadge
                        className={styles.stageInlineBadge}
                        label={labels.pendingReview.format.replace(
                          COUNT_PLACEHOLDER,
                          formatIntegerCount(pendingReviewCount, locale),
                        )}
                        status={ContactLeadStatus.PendingReview}
                      />
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
                          stageConversionRatio,
                          locale,
                          shareLabel,
                        )}
                  </span>
                </div>

                <p className={styles.stageDescription}>{stageDescription}</p>
              </article>

              {nextStage !== null ? (
                <FunnelConnector
                  ariaLabel={labels.connectorAriaLabel}
                  index={index}
                  locale={locale}
                  nextCount={nextStage.count}
                  nextStageTone={getLeadStatusBadgeTone(nextStage.key)}
                  previousCount={stage.count}
                />
              ) : null}
            </li>
          );
        })}
      </ol>

      {insight !== null ? (
        <p className={styles.insight} data-kind={insight.kind}>
          <span aria-hidden="true" className={styles.insightIcon}>
            <FontAwesomeIcon icon={faArrowRightLong} />
          </span>
          <span className={styles.insightText}>
            {insight.kind === "drop"
              ? labels.insight.largestDropOff
                  .replace(
                    FROM_PLACEHOLDER,
                    labels.stageLabels[insight.stage.fromKey],
                  )
                  .replace(
                    TO_PLACEHOLDER,
                    labels.stageLabels[insight.stage.toKey],
                  )
                  .replace(
                    DROP_PLACEHOLDER,
                    formatIntegerCount(insight.stage.dropCount, locale),
                  )
              : labels.insight.weakestConversion
                  .replace(
                    FROM_PLACEHOLDER,
                    labels.stageLabels[insight.stage.fromKey],
                  )
                  .replace(
                    TO_PLACEHOLDER,
                    labels.stageLabels[insight.stage.toKey],
                  )
                  .replace(
                    PERCENT_PLACEHOLDER,
                    formatIntegerCount(insight.stage.conversionPercent, locale),
                  )}
          </span>
        </p>
      ) : null}
    </section>
  );
}
