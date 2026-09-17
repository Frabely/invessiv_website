"use client";

import { useRouter } from "next/navigation";
import { faPenToSquare, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { Locale } from "@/config/i18n";
import { useNavigationContext } from "@/hooks/workspace/use-navigation-context";
import { DefinitionList, DetailSection, SidePanel } from "@invessiv/ui";
import type { LeadDetailDto } from "@invessiv/common/contracts/leads/lead-detail.dto";
import type {
  LeadsDetailDictionary,
  LeadsOutreachDictionary,
  LeadsSharedDictionary,
} from "@/i18n/dictionaries/workspace/leads";
import {
  LeadCategoryBadge,
  LeadScoreBar,
  LeadSocialProfiles,
  LeadSourceBadge,
  LeadStatusBadge,
} from "@/components/workspace/leads/shared";
import { formatLeadCreatedAt } from "@/components/workspace/leads/table/lead-table-utils";
import { LeadOutreachTriggerVariant } from "@invessiv/common/constants/leads/outreach/lead-outreach-trigger-variants";
import { LeadOutreachTrigger } from "../../outreach/lead-outreach-trigger/lead-outreach-trigger";
import { ActivityTimeline } from "@/components/workspace/shared/activity/activity-timeline/activity-timeline";
import styles from "./lead-detail-panel.module.css";

export type LeadDetailPanelProps = {
  canConvert?: boolean;
  canEdit: boolean;
  closeHref: string;
  content: LeadsDetailDictionary;
  editHref: string;
  conversionHref?: string;
  customerHref?: string;
  lead: LeadDetailDto;
  locale: Locale;
  outreachContent?: LeadsOutreachDictionary;
  sharedContent: LeadsSharedDictionary;
};

type DetailFieldProps = {
  children: React.ReactNode;
  label: string;
};

function DetailField({ children, label }: DetailFieldProps) {
  return (
    <div className={styles.field}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function getCategoryLabel(
  lead: LeadDetailDto,
  sharedContent: LeadsSharedDictionary,
  emptyLabel: string,
): string {
  const labelKey = lead.category?.labelKey;

  if (!labelKey) {
    return emptyLabel;
  }

  if (labelKey in sharedContent.category) {
    return sharedContent.category[
      labelKey as keyof typeof sharedContent.category
    ];
  }

  return labelKey;
}

function getExternalWebsiteHref(websiteUrl: string | null): string | undefined {
  if (!websiteUrl) {
    return undefined;
  }

  if (/^https?:\/\//i.test(websiteUrl)) {
    return websiteUrl;
  }

  return `https://${websiteUrl}`;
}

function getPhoneHref(phone: string | null): string | undefined {
  return phone ? `tel:${phone.replace(/\s+/g, "")}` : undefined;
}

export function LeadDetailPanel({
  canConvert = false,
  canEdit,
  closeHref,
  content,
  editHref,
  conversionHref = "",
  customerHref,
  lead,
  locale,
  outreachContent,
  sharedContent,
}: LeadDetailPanelProps) {
  const router = useRouter();
  const startTransition = useNavigationContext();
  const displayName = lead.displayName;
  const categoryLabel = getCategoryLabel(
    lead,
    sharedContent,
    content.empty.category,
  );
  const createdAt = formatLeadCreatedAt(locale, lead.createdAt);
  const updatedAt = formatLeadCreatedAt(locale, lead.updatedAt);
  const phoneHref = getPhoneHref(lead.phone);
  const websiteHref = getExternalWebsiteHref(lead.websiteUrl);

  return (
    <SidePanel className={styles.panel}>
      <header className={styles.header}>
        <div className={styles.heading}>
          <p className={styles.eyebrow}>{content.sections.contact}</p>
          <h2 className={styles.title} id="lead-detail-title">
            {displayName}
          </h2>
          {lead.email ? (
            <a className={styles.emailLink} href={`mailto:${lead.email}`}>
              {lead.email}
            </a>
          ) : null}
        </div>

        <div className={styles.actions}>
          {outreachContent ? (
            <LeadOutreachTrigger
              content={outreachContent}
              lead={{
                displayName: lead.displayName,
                id: lead.id,
              }}
              variant={LeadOutreachTriggerVariant.IconOnly}
            />
          ) : null}

          {canEdit ? (
            <button
              aria-label={content.actions.edit}
              className={styles.editIconLink}
              onClick={() => startTransition(() => router.push(editHref))}
              title={content.actions.edit}
              type="button"
            >
              <FontAwesomeIcon aria-hidden="true" icon={faPenToSquare} />
            </button>
          ) : null}

          <button
            aria-label={content.actions.closeAriaLabel}
            className={styles.closeButton}
            onClick={() => startTransition(() => router.push(closeHref))}
            title={content.actions.closeAriaLabel}
            type="button"
          >
            <FontAwesomeIcon aria-hidden="true" icon={faXmark} />
          </button>
        </div>
      </header>

      <div className={styles.badgeRow}>
        <LeadStatusBadge
          label={sharedContent.status[lead.leadStatus]}
          status={lead.leadStatus}
        />
        <LeadSourceBadge
          label={sharedContent.source[lead.source]}
          source={lead.source}
        />
      </div>

      {customerHref ? (
        <section className={styles.conversionCard} data-state="converted">
          <p>{content.conversion.converted}</p>
          <button
            className={styles.conversionButton}
            onClick={() => startTransition(() => router.push(customerHref))}
            type="button"
          >
            {content.actions.openCustomer}
          </button>
        </section>
      ) : canConvert ? (
        <section className={styles.conversionCard} data-state="available">
          <p>{content.conversion.available}</p>
          <button
            className={styles.conversionButton}
            onClick={() => startTransition(() => router.push(conversionHref))}
            type="button"
          >
            {content.actions.convert}
          </button>
        </section>
      ) : null}

      <DetailSection id="lead-contact-title" title={content.sections.contact}>
        <DefinitionList>
          <DetailField label={content.fields.email}>
            {lead.email ? (
              <a className={styles.textLink} href={`mailto:${lead.email}`}>
                {lead.email}
              </a>
            ) : (
              <span className={styles.emptyText}>{content.empty.email}</span>
            )}
          </DetailField>

          <DetailField label={content.fields.phone}>
            {phoneHref ? (
              <a className={styles.textLink} href={phoneHref}>
                {lead.phone}
              </a>
            ) : (
              <span className={styles.emptyText}>{content.empty.phone}</span>
            )}
          </DetailField>

          <DetailField label={content.fields.company}>
            {lead.companyName || (
              <span className={styles.emptyText}>{content.empty.company}</span>
            )}
          </DetailField>

          <DetailField label={content.fields.website}>
            {websiteHref ? (
              <a
                className={styles.textLink}
                href={websiteHref}
                rel="noopener noreferrer"
                target="_blank"
              >
                {lead.websiteUrl}
              </a>
            ) : (
              <span className={styles.emptyText}>{content.empty.website}</span>
            )}
          </DetailField>

          <DetailField label={content.fields.owner}>
            {lead.owner || (
              <span className={styles.emptyText}>{content.empty.owner}</span>
            )}
          </DetailField>
        </DefinitionList>
      </DetailSection>

      <DetailSection
        actions={
          <LeadCategoryBadge
            categoryKey={lead.category?.labelKey}
            label={categoryLabel}
          />
        }
        id="lead-category-title"
        title={content.sections.category}
      >
        <DefinitionList>
          <DetailField label={content.fields.score}>
            <LeadScoreBar
              ariaLabel={sharedContent.score.ariaLabel}
              score={lead.score}
            />
          </DetailField>

          <div className={styles.dateFields}>
            <DetailField label={content.fields.created}>
              {createdAt}
            </DetailField>
            <DetailField label={content.fields.updated}>
              {updatedAt}
            </DetailField>
          </div>
        </DefinitionList>
      </DetailSection>

      <DetailSection
        id="lead-social-title"
        title={content.sections.socialProfiles}
      >
        <LeadSocialProfiles
          emptyLabel={content.empty.socialProfiles}
          labels={sharedContent.socialIconLabel}
          phone={lead.phone}
          profiles={lead.socialProfiles}
          websiteUrl={lead.websiteUrl}
        />
      </DetailSection>

      <DetailSection id="lead-notes-title" title={content.sections.notes}>
        <p className={lead.notes ? styles.bodyText : styles.emptyText}>
          {lead.notes || content.empty.notes}
        </p>
      </DetailSection>

      <DetailSection
        id="lead-improvements-title"
        title={content.sections.improvements}
      >
        {lead.improvements && lead.improvements.length > 0 ? (
          <ul className={styles.improvementList}>
            {lead.improvements.map((item) => (
              <li className={styles.improvementItem} key={item}>
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.emptyText}>{content.empty.improvements}</p>
        )}
      </DetailSection>

      <DetailSection
        actions={
          <button className={styles.disabledButton} disabled type="button">
            {content.actions.viewFullProfile}
          </button>
        }
        id="lead-activity-title"
        title={content.sections.activity}
      >
        <ActivityTimeline
          activities={lead.activities}
          content={content}
          locale={locale}
          sharedContent={sharedContent}
          submissions={lead.submissions}
        />
      </DetailSection>
    </SidePanel>
  );
}
