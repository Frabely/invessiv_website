"use client";

import { useState } from "react";
import Link from "next/link";
import { faTag } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import { ProjectLineItemStatus } from "@invessiv/common/constants/crm/project-line-item-statuses";
import type { ProjectLineItemDto } from "@invessiv/common/contracts/crm/project-line-item.dto";
import type { LineItemTemplateDto } from "@invessiv/common/contracts/crm/line-item-template.dto";
import type { ProjectLineItemValue } from "@invessiv/common/contracts/crm/project-line-item-value";
import { ButtonLink, PrimaryCtaButton } from "@invessiv/ui";
import type { Locale } from "@/config/i18n";
import type { CrmProjectLineItemsDictionary } from "@/i18n/dictionaries/workspace/crm";
import { formatMessage } from "@/lib/i18n/format-message";
import { formatEuroCents } from "@/lib/workspace/crm/format-service-price";
import { CollapsibleSection } from "@/components/workspace/crm/shared/collapsible-section/collapsible-section";
import { SectionEmptyState } from "@/components/workspace/crm/shared/section-empty-state/section-empty-state";
import { ProjectLineItemFormDialog } from "../project-line-item-form-dialog/project-line-item-form-dialog";
import styles from "./project-line-items-section.module.css";

export type ProjectLineItemsSectionProps = {
  canWrite: boolean;
  catalogHref: string | null;
  content: CrmProjectLineItemsDictionary;
  locale: Locale;
  projectId: string;
  services: readonly ProjectLineItemDto[];
  templates: readonly LineItemTemplateDto[];
  value?: ProjectLineItemValue;
};

/** How often the amount is due, as a phrase that reads under the price rather than beside it. */
function cadenceLabel(
  service: ProjectLineItemDto,
  content: CrmProjectLineItemsDictionary,
): string {
  if (service.pricingMode === ServicePricingMode.Rate) {
    return content.list.cadence.rate;
  }
  if (
    service.pricingMode === ServicePricingMode.Recurring &&
    service.recurringInterval
  ) {
    return content.list.cadence[service.recurringInterval];
  }
  return content.list.cadence.one_time;
}

/**
 * The services of one project, read as a statement: what is in scope, what it costs, in the
 * order it was agreed. The same dialog assigns and edits.
 */
export function ProjectLineItemsSection({
  canWrite,
  catalogHref,
  content,
  locale,
  projectId,
  services,
  templates,
  value = { oneTimeCents: 0, monthlyCents: 0 },
}: ProjectLineItemsSectionProps) {
  const [editing, setEditing] = useState<ProjectLineItemDto | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  function openDialog(service: ProjectLineItemDto | null) {
    setEditing(service);
    setDialogOpen(true);
  }

  function renderLine(service: ProjectLineItemDto) {
    return (
      <>
        <span className={styles.name}>
          {service.title}
          {service.sourceLineItemTemplateId === null ? (
            <span className={styles.origin}>
              {content.list.templateRemoved}
            </span>
          ) : null}
          <span className={styles.origin}>
            {
              content.list.status[
                service.status ?? ProjectLineItemStatus.Confirmed
              ]
            }
          </span>
        </span>
        <span className={styles.amount}>
          {formatEuroCents(service.priceCents, locale)}
        </span>
        <span className={styles.description}>{service.description}</span>
        <span className={styles.cadence}>{cadenceLabel(service, content)}</span>
      </>
    );
  }

  return (
    <CollapsibleSection
      action={
        canWrite ? (
          <PrimaryCtaButton
            className={styles.actionButton}
            onClick={() => openDialog(null)}
            type="button"
          >
            <FontAwesomeIcon aria-hidden="true" icon={faTag} />
            {content.section.assignAction}
          </PrimaryCtaButton>
        ) : null
      }
      after={
        dialogOpen && canWrite ? (
          <ProjectLineItemFormDialog
            catalogHref={catalogHref}
            content={content}
            key={editing?.id ?? "assign"}
            locale={locale}
            onCloseAction={() => setDialogOpen(false)}
            projectId={projectId}
            projectLineItem={editing}
            templates={templates}
          />
        ) : null
      }
      count={
        services.length > 0
          ? services.length === 1
            ? content.section.countOne
            : formatMessage(content.section.count, {
                count: String(services.length),
              })
          : undefined
      }
      labelCollapse={content.section.collapseLabel}
      labelExpand={content.section.expandLabel}
      summary={
        <dl className={styles.values}>
          <div className={styles.value}>
            <dt>{content.values.oneTime}:</dt>
            <dd>{formatEuroCents(value.oneTimeCents, locale)}</dd>
          </div>
          <div className={styles.value}>
            <dt>{content.values.monthly}:</dt>
            <dd>{formatEuroCents(value.monthlyCents, locale)}</dd>
          </div>
        </dl>
      }
      title={content.section.title}
    >
      {services.length === 0 ? (
        <SectionEmptyState
          description={
            canWrite
              ? content.empty.description
              : content.emptyReadOnly.description
          }
          title={canWrite ? content.empty.title : content.emptyReadOnly.title}
          action={
            canWrite && catalogHref && templates.length === 0 ? (
              <ButtonLink
                href={catalogHref}
                linkComponent={Link}
                variant="ghost"
              >
                {content.form.noTemplates.action}
              </ButtonLink>
            ) : null
          }
        />
      ) : (
        <ul aria-label={content.list.ariaLabel} className={styles.ledger}>
          {services.map((service) => (
            <li className={styles.item} key={service.id}>
              {canWrite ? (
                <button
                  aria-label={formatMessage(content.list.editNamed, {
                    name: service.title,
                  })}
                  className={styles.row}
                  onClick={() => openDialog(service)}
                  type="button"
                >
                  {renderLine(service)}
                </button>
              ) : (
                <div className={styles.row}>{renderLine(service)}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </CollapsibleSection>
  );
}
