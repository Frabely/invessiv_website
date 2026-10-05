import type { RefObject } from "react";
import type { QuestionnaireResolvedBlock } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-resolved-block";
import { ButtonControl } from "@invessiv/ui";
import { OnboardingTemplateReadView } from "@/components/shared/onboarding/onboarding-template-read-view/onboarding-template-read-view";
import type { CrmQuestionnaireDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./questionnaire-template-preview.module.css";

export type QuestionnaireTemplatePreviewProps = {
  blocks: readonly QuestionnaireResolvedBlock[];
  content: CrmQuestionnaireDictionary;
  hasLoadError: boolean;
  loading: boolean;
  onRetryAction: () => void;
  scrollRef: RefObject<HTMLDivElement | null>;
  titleId: string;
};

export function QuestionnaireTemplatePreview({
  blocks,
  content,
  hasLoadError,
  loading,
  onRetryAction,
  scrollRef,
  titleId,
}: QuestionnaireTemplatePreviewProps) {
  const text = content.templateEditor.preview;
  return (
    <section aria-labelledby={titleId} className={styles.preview}>
      <header className={styles.header}>
        <h2 id={titleId}>{text.title}</h2>
        <p>{text.description}</p>
      </header>
      <div className={styles.scroll} data-preview-scroll ref={scrollRef}>
        <OnboardingTemplateReadView
          blocks={blocks}
          emptyText={text.empty}
          texts={{
            fieldTypes: content.fieldTypes,
            assetKinds: content.assetKinds,
            maxLength: text.maxLength,
            minItems: text.minItems,
            maxItems: text.maxItems,
            acceptedKinds: text.acceptedKinds,
            options: text.options,
            condition: text.condition,
            required: text.required,
          }}
        />
      </div>
      {loading ? <p role="status">{text.loading}</p> : null}
      {hasLoadError ? (
        <div className={styles.error} role="alert">
          <p>{text.loadError}</p>
          <ButtonControl onClick={onRetryAction} type="button" variant="ghost">
            {text.retry}
          </ButtonControl>
        </div>
      ) : null}
    </section>
  );
}
