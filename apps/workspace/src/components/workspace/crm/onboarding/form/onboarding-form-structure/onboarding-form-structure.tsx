"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useRef } from "react";
import {
  faBookOpen,
  faCircleInfo,
  faLayerGroup,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { QUESTIONNAIRE_LIMITS } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import type { QuestionnaireBlockSummaryDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block-summary.dto";
import type { QuestionnaireTemplateSummaryDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-template-summary.dto";
import { isOnboardingStructureEditable } from "@invessiv/common/patterns/crm/onboarding/onboarding-form-state";
import { flattenQuestionnaireFields } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-block-structure";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonControl, ConfirmDialog } from "@invessiv/ui";
import { onboardingFormApiService } from "@/client/crm/onboarding-form-api-service";
import { OnboardingStructureDialogKind } from "@/common/constants/crm/onboarding/onboarding-structure-dialog-kinds";
import type { OnboardingFormErrorTexts } from "@/common/contracts/crm/onboarding/onboarding-form-error-texts";
import type { QuestionnaireFixedChoiceLabels } from "@/common/contracts/crm/questionnaire/questionnaire-fixed-choice-labels";
import {
  buildOnboardingFormHref,
  readOnboardingFormBlockId,
} from "@/common/patterns/crm/onboarding/onboarding-form-query";
import { OrderedBlockListEditor } from "@/components/workspace/crm/questionnaire/block-list/ordered-block-list-editor/ordered-block-list-editor";
import { QuestionnaireBlockPickerDialog } from "@/components/workspace/crm/questionnaire/block-list/questionnaire-block-picker-dialog/questionnaire-block-picker-dialog";
import { QuestionnaireBlockEditor } from "@/components/workspace/crm/questionnaire/editor/questionnaire-block-editor/questionnaire-block-editor";
import type { Locale } from "@/config/i18n";
import { useOnboardingFormStructure } from "@/hooks/workspace/crm/use-onboarding-form-structure";
import type {
  CrmOnboardingDictionary,
  CrmQuestionnaireDictionary,
} from "@/i18n/dictionaries/workspace/crm";
import { OnboardingFieldDeleteDialog } from "../onboarding-field-delete-dialog/onboarding-field-delete-dialog";
import { OnboardingOwnBlockDialog } from "../onboarding-own-block-dialog/onboarding-own-block-dialog";
import { OnboardingStartDialog } from "../../project/onboarding-start-dialog/onboarding-start-dialog";
import styles from "./onboarding-form-structure.module.css";

export type OnboardingFormStructureProps = {
  /** `projects.write` on the form's project; the status may still lock the structure. */
  canWrite: boolean;
  /** Active catalog blocks for the picker; empty when the form cannot be changed. */
  catalogBlocks: readonly QuestionnaireBlockSummaryDto[];
  content: CrmOnboardingDictionary;
  fixedChoiceLabels: QuestionnaireFixedChoiceLabels;
  form: OnboardingFormDto;
  locale: Locale;
  /** Called with every form the server answers with, e.g. to keep the page head in step. */
  onFormChangeAction?: (form: OnboardingFormDto) => void;
  /** Texts of the embedded block editor and of the kit's error codes. */
  questionnaireContent: CrmQuestionnaireDictionary;
  templates: readonly QuestionnaireTemplateSummaryDto[];
};

/**
 * The blocks of a form on the left, the kit's block editor for the chosen one on the right. Every
 * change of the list is one server command against the form version; the block editor writes with
 * its own block version, after which the form is read again so the list keeps a current version.
 */
export function OnboardingFormStructure({
  canWrite,
  catalogBlocks,
  content,
  fixedChoiceLabels,
  form: initialForm,
  locale,
  onFormChangeAction,
  questionnaireContent,
  templates,
}: OnboardingFormStructureProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const text = content.structure;
  const errorTexts: OnboardingFormErrorTexts = {
    onboarding: content.errors,
    questionnaire: questionnaireContent.errors,
  };
  const selectedId = readOnboardingFormBlockId(
    new URLSearchParams(searchParams.toString()),
  );

  function hrefFor(blockId: string | null): string {
    return buildOnboardingFormHref(pathname, searchParams.toString(), blockId);
  }

  const {
    addCatalogBlocks,
    applyTemplate,
    addOwnBlock,
    announceListMessage,
    announcement,
    busy,
    dialog,
    failure,
    form,
    handleBlockChange,
    handleListChange,
    ids,
    nameOf,
    removeBlock,
    setDialog,
  } = useOnboardingFormStructure({
    initialForm,
    locale,
    text,
    errorTexts,
    onFormChangeAction,
    onSelectAction: (blockId) =>
      router.replace(hrefFor(blockId), { scroll: false }),
    onRemovedAction: (block) => {
      if (selectedId === block.id)
        router.replace(hrefFor(null), { scroll: false });
      // The row that held the focus is gone.
      headingRef.current?.focus();
    },
  });
  const definitionApi = useMemo(
    () => onboardingFormApiService.definitionApi(form.id),
    [form.id],
  );
  const editable = canWrite && isOnboardingStructureEditable(form.status);
  const blocks = new Map(
    form.blocks.map((step) => [step.block.id, step.block]),
  );
  // An id the form does not have opens nothing; it is not an error.
  const selected = selectedId ? blocks.get(selectedId) : undefined;

  const removing =
    dialog?.kind === OnboardingStructureDialogKind.Remove
      ? blocks.get(dialog.blockId)
      : undefined;
  const blockCount = form.blocks.length;

  return (
    <div className={styles.structure}>
      <section
        aria-labelledby="onboarding-blocks-heading"
        className={styles.list}
      >
        <header className={styles.listHeader}>
          <h2
            className={styles.heading}
            id="onboarding-blocks-heading"
            ref={headingRef}
            tabIndex={-1}
          >
            {text.blocks.legend}
            <span className={styles.count}>
              {blockCount === 1
                ? text.blocks.countOne
                : formatMessage(text.blocks.count, { count: blockCount })}
            </span>
          </h2>
          {editable ? (
            <div className={styles.listActions}>
              {form.status === OnboardingFormStatus.Draft &&
              blockCount === 0 &&
              templates.length > 0 ? (
                <ButtonControl
                  className={styles.addButton}
                  disabled={busy}
                  onClick={() =>
                    setDialog({
                      kind: OnboardingStructureDialogKind.Template,
                      failure: null,
                    })
                  }
                  type="button"
                  variant="ghost"
                >
                  <FontAwesomeIcon aria-hidden="true" icon={faLayerGroup} />
                  {text.blocks.chooseTemplate}
                </ButtonControl>
              ) : null}
              <ButtonControl
                className={styles.addButton}
                disabled={
                  busy || blockCount >= QUESTIONNAIRE_LIMITS.blocksPerOwner
                }
                onClick={() =>
                  setDialog({
                    kind: OnboardingStructureDialogKind.Picker,
                    failure: null,
                  })
                }
                type="button"
                variant="ghost"
              >
                <FontAwesomeIcon aria-hidden="true" icon={faBookOpen} />
                {text.blocks.addFromCatalog}
              </ButtonControl>
              <ButtonControl
                className={styles.addButton}
                disabled={
                  busy || blockCount >= QUESTIONNAIRE_LIMITS.blocksPerOwner
                }
                onClick={() =>
                  setDialog({
                    kind: OnboardingStructureDialogKind.Own,
                    failure: null,
                  })
                }
                type="button"
                variant="ghost"
              >
                <FontAwesomeIcon aria-hidden="true" icon={faPlus} />
                {text.blocks.addOwn}
              </ButtonControl>
            </div>
          ) : null}
        </header>
        {editable ? null : (
          <p className={styles.notice}>
            <FontAwesomeIcon aria-hidden="true" icon={faCircleInfo} />
            {canWrite ? text.editor.locked : text.editor.readOnly}
          </p>
        )}
        {editable && form.status === OnboardingFormStatus.Open ? (
          <p className={styles.notice}>
            <FontAwesomeIcon aria-hidden="true" icon={faCircleInfo} />
            {text.editor.released}
          </p>
        ) : null}
        {failure ? (
          <p className={styles.failure} role="alert">
            {failure}
          </p>
        ) : null}
        <OrderedBlockListEditor
          disabled={busy}
          empty={
            <p className={styles.empty}>
              {editable ? text.blocks.empty : text.blocks.emptyReadOnly}
            </p>
          }
          items={ids.flatMap((id) => {
            const block = blocks.get(id);
            if (!block) return [];
            const name = nameOf(block);
            const fieldCount = flattenQuestionnaireFields(block.fields).length;
            const current = block.id === selected?.id;
            return {
              id,
              name,
              detail: (
                <>
                  <span>
                    {fieldCount === 1
                      ? text.blocks.fieldsOne
                      : formatMessage(text.blocks.fields, {
                          count: fieldCount,
                        })}
                  </span>
                  {block.sourceBlockId === null ? (
                    <span className={styles.own}>{text.blocks.own}</span>
                  ) : null}
                  <Link
                    aria-current={current ? "true" : undefined}
                    aria-label={formatMessage(text.blocks.openNamed, { name })}
                    className={styles.open}
                    href={hrefFor(block.id)}
                    replace
                    scroll={false}
                  >
                    {current ? text.blocks.current : text.blocks.open}
                  </Link>
                </>
              ),
            };
          })}
          labels={text.blocks}
          onAnnounceAction={announceListMessage}
          onChangeAction={(nextIds) => void handleListChange(nextIds)}
          readOnly={!editable}
        />
        <p aria-live="polite" className="sr-only">
          {announcement}
        </p>
      </section>

      <section
        aria-labelledby="onboarding-block-editor-heading"
        className={styles.editor}
      >
        <h2 className="sr-only" id="onboarding-block-editor-heading">
          {text.editor.heading}
        </h2>
        {selected ? (
          <QuestionnaireBlockEditor
            api={definitionApi}
            block={selected}
            canWrite={editable}
            content={questionnaireContent}
            fixedChoiceLabels={fixedChoiceLabels}
            key={selected.id}
            locale={locale}
            onBlockChangeAction={(block) => void handleBlockChange(block)}
            renderDeleteDialogAction={(deleteDialog) => (
              <OnboardingFieldDeleteDialog
                content={text.fieldDeleteDialog}
                dialog={deleteDialog}
                formId={form.id}
              />
            )}
            showStatus={false}
          />
        ) : (
          <p className={styles.placeholder}>{text.editor.select}</p>
        )}
      </section>

      {editable && dialog?.kind === OnboardingStructureDialogKind.Picker ? (
        <QuestionnaireBlockPickerDialog
          busy={busy}
          blocks={catalogBlocks}
          chosenIds={form.blocks.flatMap(
            (step) => step.block.sourceBlockId ?? [],
          )}
          content={text.picker}
          failure={dialog.failure}
          locale={locale}
          maxSelection={Math.min(
            QUESTIONNAIRE_LIMITS.catalogBlocksPerAdd,
            QUESTIONNAIRE_LIMITS.blocksPerOwner - blockCount,
          )}
          onAddAction={addCatalogBlocks}
          onCloseAction={() => {
            if (!busy) setDialog(null);
          }}
        />
      ) : null}
      {editable && dialog?.kind === OnboardingStructureDialogKind.Template ? (
        <OnboardingStartDialog
          busy={busy}
          content={content.project.dialog}
          failure={dialog.failure}
          mode="apply"
          onApplyAction={async (templateId) => {
            const applied = await applyTemplate(templateId);
            if (applied) router.refresh();
            return applied;
          }}
          onCloseAction={() => {
            if (!busy) setDialog(null);
          }}
          templates={templates}
          applyTexts={text.templateDialog}
        />
      ) : null}
      {editable && dialog?.kind === OnboardingStructureDialogKind.Own ? (
        <OnboardingOwnBlockDialog
          busy={busy}
          content={text.ownDialog}
          failure={dialog.failure}
          locale={locale}
          onCloseAction={() => setDialog(null)}
          onSubmitAction={(identity) => void addOwnBlock(identity)}
          validation={questionnaireContent.catalog.validation}
        />
      ) : null}
      {editable && removing ? (
        <ConfirmDialog
          busy={busy}
          cancelLabel={text.removeDialog.cancel}
          closeLabel={text.removeDialog.close}
          confirmLabel={text.removeDialog.confirm}
          description={formatMessage(text.removeDialog.description, {
            name: nameOf(removing),
          })}
          onCancelAction={() => setDialog(null)}
          onConfirmAction={() => void removeBlock(removing)}
          title={text.removeDialog.title}
          tone="danger"
        />
      ) : null}
    </div>
  );
}
