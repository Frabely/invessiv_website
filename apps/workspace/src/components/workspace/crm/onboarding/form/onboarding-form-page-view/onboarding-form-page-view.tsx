"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { OnboardingFormContextDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form-context.dto";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import type { QuestionnaireBlockSummaryDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block-summary.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { TabList } from "@invessiv/ui";
import {
  ONBOARDING_FORM_TAB_VALUES,
  OnboardingFormTab,
} from "@/common/constants/crm/onboarding/onboarding-form-tabs";
import type { QuestionnaireFixedChoiceLabels } from "@/common/contracts/crm/questionnaire/questionnaire-fixed-choice-labels";
import type { Locale } from "@/config/i18n";
import type {
  CrmOnboardingDictionary,
  CrmQuestionnaireDictionary,
} from "@/i18n/dictionaries/workspace/crm";
import { OnboardingStatusBadge } from "../../project/onboarding-status-badge/onboarding-status-badge";
import { OnboardingFormStructure } from "../onboarding-form-structure/onboarding-form-structure";
import styles from "./onboarding-form-page-view.module.css";

export type OnboardingFormPageViewProps = {
  /** The project tab of the customer's cockpit this form belongs to. */
  backHref: string;
  canWrite: boolean;
  catalogBlocks: readonly QuestionnaireBlockSummaryDto[];
  content: CrmOnboardingDictionary;
  context: OnboardingFormContextDto;
  fixedChoiceLabels: QuestionnaireFixedChoiceLabels;
  form: OnboardingFormDto;
  locale: Locale;
  questionnaireContent: CrmQuestionnaireDictionary;
};

/**
 * The internal page of one form: where it belongs, its status, and its tabs. The structure is the
 * only tab so far; answers and review join it with their tasks.
 */
export function OnboardingFormPageView({
  backHref,
  canWrite,
  catalogBlocks,
  content,
  context,
  fixedChoiceLabels,
  form: initialForm,
  locale,
  questionnaireContent,
}: OnboardingFormPageViewProps) {
  const tabId = useId();
  const panelId = useId();
  // A conflict can bring a form whose status changed; the head follows it.
  const [form, setForm] = useState(initialForm);
  const text = content.form;

  return (
    <div className={styles.page}>
      <Link className={styles.back} href={backHref}>
        <FontAwesomeIcon aria-hidden="true" icon={faArrowLeft} />
        {text.back}
      </Link>
      <header className={styles.header}>
        <h1 className={styles.title}>
          {formatMessage(text.title, { project: context.projectTitle })}
        </h1>
        <dl className={styles.meta}>
          <div className={styles.metaItem}>
            <dt>{text.customer}</dt>
            <dd>{context.customerName}</dd>
          </div>
          <div className={styles.metaItem}>
            <dt>{text.template}</dt>
            <dd>{context.templateTitle ?? text.templateNone}</dd>
          </div>
        </dl>
        <OnboardingStatusBadge
          label={content.status[form.status]}
          status={form.status}
        />
      </header>
      <TabList
        activeValue={OnboardingFormTab.Structure}
        ariaLabel={text.tabs.ariaLabel}
        items={ONBOARDING_FORM_TAB_VALUES.map((tab) => ({
          value: tab,
          id: tabId,
          panelId,
          label: text.tabs[tab],
        }))}
        // One tab only: there is nothing to switch to yet.
        onSelectAction={() => undefined}
      />
      <div aria-labelledby={tabId} id={panelId} role="tabpanel">
        <OnboardingFormStructure
          canWrite={canWrite}
          catalogBlocks={catalogBlocks}
          content={content}
          fixedChoiceLabels={fixedChoiceLabels}
          form={initialForm}
          locale={locale}
          onFormChangeAction={setForm}
          questionnaireContent={questionnaireContent}
        />
      </div>
    </div>
  );
}
