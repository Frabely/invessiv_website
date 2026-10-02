"use client";

import { useEffect, useState } from "react";
import { QuestionnaireFieldType } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-types";
import type { OnboardingFieldUsageDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-field-usage.dto";
import { formatCountMessage } from "@invessiv/common/patterns/i18n/format-count-message";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ConfirmDialog } from "@invessiv/ui";
import { onboardingFormApiService } from "@/client/crm/onboarding-form-api-service";
import type { QuestionnaireFieldDeleteDialog } from "@/common/contracts/crm/questionnaire/questionnaire-field-delete-dialog";
import type { CrmOnboardingDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./onboarding-field-delete-dialog.module.css";

export type OnboardingFieldDeleteDialogProps = {
  content: CrmOnboardingDictionary["structure"]["fieldDeleteDialog"];
  /** Field, busy state and actions as the block editor hands them over. */
  dialog: QuestionnaireFieldDeleteDialog;
  formId: string;
};

/** `null` while counting, `"failed"` when the count could not be loaded. */
type Usage = OnboardingFieldUsageDto | "failed" | null;

function describeUsage(
  usage: Usage,
  content: OnboardingFieldDeleteDialogProps["content"],
): string {
  if (usage === null) return content.usageLoading;
  if (usage === "failed") return content.usageFailed;
  const sentences: string[] = [];
  if (usage.answers > 0 || usage.files > 0)
    sentences.push(
      formatMessage(content.usage, {
        answers: formatCountMessage(usage.answers, content.answers),
        files: formatCountMessage(usage.files, content.files),
      }),
    );
  // Entries go with their group even while nobody has filled them in.
  if (usage.entries > 0)
    sentences.push(
      formatMessage(content.usageEntries, {
        entries: formatCountMessage(usage.entries, content.entries),
      }),
    );
  return sentences.length > 0 ? sentences.join(" ") : content.usageNone;
}

/**
 * The delete confirmation of a field in a form. Unlike in the catalog the field may already carry
 * answers, so the dialog says how many answers and file links go with it before anything is lost.
 */
export function OnboardingFieldDeleteDialog({
  content,
  dialog,
  formId,
}: OnboardingFieldDeleteDialogProps) {
  const [usage, setUsage] = useState<Usage>(null);
  const fieldId = dialog.field.id;

  useEffect(() => {
    let active = true;
    void onboardingFormApiService
      .getFieldUsage(formId, fieldId)
      .then((result) => {
        if (active) setUsage(result.ok ? result.value : "failed");
      });
    return () => {
      active = false;
    };
  }, [formId, fieldId]);

  return (
    <ConfirmDialog
      // Counting takes a moment; nothing is deleted before the number is on screen.
      busy={dialog.busy || usage === null}
      cancelLabel={content.cancel}
      closeLabel={content.close}
      confirmLabel={content.confirm}
      description={formatMessage(
        dialog.field.type === QuestionnaireFieldType.Group
          ? content.descriptionGroup
          : content.description,
        { name: dialog.name },
      )}
      onCancelAction={dialog.onCancelAction}
      onConfirmAction={dialog.onConfirmAction}
      title={content.title}
      tone="danger"
    >
      <p aria-live="polite" className={styles.usage}>
        {describeUsage(usage, content)}
      </p>
    </ConfirmDialog>
  );
}
