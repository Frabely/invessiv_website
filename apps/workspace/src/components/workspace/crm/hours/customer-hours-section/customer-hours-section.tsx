"use client";

import { useState } from "react";
import { faClock } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import type { CustomerHoursProjectDto } from "@invessiv/common/contracts/crm/hours/customer-hours-project.dto";
import { formatDuration } from "@invessiv/common/patterns/crm/hours/format-duration";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { PrimaryCtaButton } from "@invessiv/ui";
import { CustomerHoursDialogKind } from "@/common/constants/crm/customer-hours-dialog-kinds";
import type { HourAllocationDirection } from "@/common/constants/crm/hour-allocation-directions";
import type { HoursViewModel } from "@/common/contracts/crm/hours/hours-view-model";
import { CollapsibleSection } from "@/components/workspace/crm/shared/collapsible-section/collapsible-section";
import { SectionEmptyState } from "@/components/workspace/crm/shared/section-empty-state/section-empty-state";
import type { Locale } from "@/config/i18n";
import type { CrmHoursDictionary } from "@/i18n/dictionaries/workspace/crm";
import { HourAllocationDialog } from "../hour-allocation-dialog/hour-allocation-dialog";
import { HourPurchaseDialog } from "../hour-purchase-dialog/hour-purchase-dialog";
import { HoursBalanceSummary } from "../hours-balance-summary/hours-balance-summary";
import { HoursHistoryList } from "../hours-history-list/hours-history-list";
import { HoursProjectList } from "../hours-project-list/hours-project-list";
import styles from "./customer-hours-section.module.css";

export type CustomerHoursSectionProps = {
  content: CrmHoursDictionary;
  customerId: string;
  locale: Locale;
  viewModel: HoursViewModel;
};

type OpenDialog =
  | { kind: typeof CustomerHoursDialogKind.Purchase }
  | {
      kind: typeof CustomerHoursDialogKind.Allocation;
      project: CustomerHoursProjectDto;
      direction: HourAllocationDirection;
    }
  | null;

/**
 * The hours of one customer: the stock, how it is split across projects, and the ledger lines
 * behind both. Without customer-wide read access only the own projects appear, and every write
 * action exists only with `canManage`.
 */
export function CustomerHoursSection({
  content,
  customerId,
  locale,
  viewModel,
}: CustomerHoursSectionProps) {
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const { canManage, hours, today } = viewModel;
  const { balance } = hours;
  const hasLedger = hours.purchases.length > 0 || hours.allocations.length > 0;
  const isEmpty =
    balance !== null && balance.purchasedMinutes === 0 && !hasLedger;

  return (
    <CollapsibleSection
      action={
        canManage && balance ? (
          <PrimaryCtaButton
            className={styles.actionButton}
            onClick={() =>
              setDialog({ kind: CustomerHoursDialogKind.Purchase })
            }
            type="button"
          >
            <FontAwesomeIcon aria-hidden="true" icon={faClock} />
            {content.section.purchaseAction}
          </PrimaryCtaButton>
        ) : null
      }
      after={
        dialog?.kind === CustomerHoursDialogKind.Purchase && balance ? (
          <HourPurchaseDialog
            balance={balance}
            content={content}
            customerId={customerId}
            onCloseAction={() => setDialog(null)}
            today={today}
          />
        ) : dialog?.kind === CustomerHoursDialogKind.Allocation ? (
          <HourAllocationDialog
            content={content}
            customerId={customerId}
            direction={dialog.direction}
            freeMinutes={balance?.freeMinutes ?? 0}
            key={`${dialog.project.projectId}:${dialog.direction}`}
            onCloseAction={() => setDialog(null)}
            projectId={dialog.project.projectId}
            projectTitle={dialog.project.title}
            releasableMinutes={dialog.project.releasableMinutes}
          />
        ) : null
      }
      count={
        balance && !isEmpty
          ? formatMessage(
              balance.remainingMinutes < 0
                ? content.section.overdrawn
                : content.section.remaining,
              { duration: formatDuration(Math.abs(balance.remainingMinutes)) },
            )
          : undefined
      }
      defaultExpanded
      labelCollapse={content.section.collapseLabel}
      labelExpand={content.section.expandLabel}
      title={content.section.title}
    >
      {isEmpty ? (
        <SectionEmptyState
          description={
            canManage
              ? content.empty.description
              : content.empty.readOnlyDescription
          }
          title={content.empty.title}
        />
      ) : (
        <div className={styles.body}>
          {balance ? (
            <HoursBalanceSummary balance={balance} content={content.balance} />
          ) : (
            <p className={styles.hint}>{content.balance.projectScopeHint}</p>
          )}
          {hours.projects.length > 0 ? (
            <HoursProjectList
              canManage={canManage}
              content={content.projects}
              freeMinutes={balance?.freeMinutes ?? 0}
              onMoveAction={(project, direction) =>
                setDialog({
                  kind: CustomerHoursDialogKind.Allocation,
                  project,
                  direction,
                })
              }
              projects={hours.projects}
            />
          ) : (
            <p className={styles.hint}>{content.projects.empty}</p>
          )}
          {hasLedger ? (
            <HoursHistoryList
              allocations={hours.allocations}
              content={content.history}
              locale={locale}
              projects={hours.projects}
              purchases={hours.purchases}
            />
          ) : null}
        </div>
      )}
    </CollapsibleSection>
  );
}
