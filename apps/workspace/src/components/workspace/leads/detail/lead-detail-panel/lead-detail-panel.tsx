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
  canEdit: boolean;
  closeHref: string;
  content: LeadsDetailDictionary;
  editHref: string;
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
  canEdit,
  closeHref,
  content,
  editHref,
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

      <section className={styles.section} aria-labelledby="lead-social-title">
        <h3 className={styles.sectionTitle} id="lead-social-title">
          {content.sections.socialProfiles}
        </h3>

        <LeadSocialProfiles
          emptyLabel={content.empty.socialProfiles}
          labels={sharedContent.socialIconLabel}
          phone={lead.phone}
          profiles={lead.socialProfiles}
          websiteUrl={lead.websiteUrl}
        />
      </section>

      <section className={styles.section} aria-labelledby="lead-notes-title">
        <h3 className={styles.sectionTitle} id="lead-notes-title">
          {content.sections.notes}
        </h3>

        <p className={lead.notes ? styles.bodyText : styles.emptyText}>
          {lead.notes || content.empty.notes}
        </p>
      </section>

      <section
        className={styles.section}
        aria-labelledby="lead-improvements-title"
      >
        <h3 className={styles.sectionTitle} id="lead-improvements-title">
          {content.sections.improvements}
        </h3>

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
      </section>

      <section className={styles.section} aria-labelledby="lead-activity-title">
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle} id="lead-activity-title">
            {content.sections.activity}
          </h3>

          <button className={styles.disabledButton} disabled type="button">
            {content.actions.viewFullProfile}
          </button>
        </div>

        <ActivityTimeline
          activities={lead.activities}
          content={content}
          locale={locale}
          sharedContent={sharedContent}
          submissions={lead.submissions}
        />
      </section>
    </SidePanel>
  );
}
