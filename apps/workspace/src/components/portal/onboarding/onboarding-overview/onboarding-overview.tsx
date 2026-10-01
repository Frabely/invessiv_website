import Link from "next/link";
import {
  faArrowLeft,
  faClipboardList,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { PortalOnboardingFormSummaryDto } from "@invessiv/common/contracts/portal/portal-onboarding-form-summary.dto";
import { Badge, ButtonLink, EmptyState } from "@invessiv/ui";
import { ONBOARDING_FORM_STATUS_BADGES } from "@/common/constants/crm/onboarding/onboarding-form-status-badges";
import { OnboardingProgressBar } from "@/components/shared/onboarding/onboarding-progress-bar/onboarding-progress-bar";
import type { PortalOnboardingDictionary } from "@/i18n/dictionaries/portal";
import styles from "./onboarding-overview.module.css";

export type OnboardingOverviewProps = {
  content: PortalOnboardingDictionary;
  dashboardHref: string;
  /** Every released form of the company, newest first, with the link to it. */
  forms: readonly { form: PortalOnboardingFormSummaryDto; href: string }[];
};

/** One row per onboarding of the company. A company with a single form never sees this list. */
export function OnboardingOverview({
  content,
  dashboardHref,
  forms,
}: OnboardingOverviewProps) {
  const texts = content.overview;

  return (
    <div className={styles.page}>
      <Link className={styles.back} href={dashboardHref}>
        <FontAwesomeIcon aria-hidden="true" icon={faArrowLeft} />
        {content.page.back}
      </Link>
      <h1 className={styles.heading}>{texts.heading}</h1>
      {forms.length === 0 ? (
        <EmptyState
          alignment="start"
          description={texts.empty.description}
          icon={<FontAwesomeIcon icon={faClipboardList} />}
          title={texts.empty.title}
        />
      ) : (
        <>
          <p className={styles.intro}>{texts.intro}</p>
          <ul aria-label={texts.listLabel} className={styles.list}>
            {forms.map(({ form, href }) => {
              const badge = ONBOARDING_FORM_STATUS_BADGES[form.status];
              return (
                <li className={styles.item} key={form.id}>
                  <div className={styles.head}>
                    <h2 className={styles.project}>{form.projectTitle}</h2>
                    <Badge
                      icon={badge.icon}
                      kind="status"
                      label={content.status[form.status]}
                      tone={badge.tone}
                    />
                  </div>
                  <OnboardingProgressBar
                    progress={form.progress}
                    texts={content.progress}
                  />
                  <div>
                    <ButtonLink
                      href={href}
                      linkComponent={Link}
                      variant={form.canEdit ? "primary" : "ghost"}
                    >
                      {form.canEdit ? texts.continue : texts.view}
                    </ButtonLink>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
