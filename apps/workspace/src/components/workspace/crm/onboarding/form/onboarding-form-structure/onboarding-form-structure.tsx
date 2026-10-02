"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import {
  faBookOpen,
  faCircleInfo,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { OnboardingFormStatus } from "@invessiv/common/constants/crm/onboarding/onboarding-form-statuses";
import { QUESTIONNAIRE_LIMITS } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";
import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import type { QuestionnaireBlockSummaryDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block-summary.dto";
import { isOnboardingStructureEditable } from "@invessiv/common/patterns/crm/onboarding/onboarding-form-state";
import { flattenQuestionnaireFields } from "@invessiv/common/patterns/crm/questionnaire/questionnaire-block-structure";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonControl, ConfirmDialog } from "@invessiv/ui";
import { VersionedMutationOutcomeKind } from "@/common/constants/client/versioned-mutation-outcome-kinds";
import { onboardingFormApiService } from "@/client/crm/onboarding-form-api-service";
import { OnboardingBlockListChangeKind } from "@/common/constants/crm/onboarding/onboarding-block-list-change-kinds";
import type { VersionedMutationOutcome } from "@/common/contracts/client/versioned-mutation-outcome";
import type { OnboardingFormErrorTexts } from "@/common/contracts/crm/onboarding/onboarding-form-error-texts";
import type { OnboardingFormClientErrorCode } from "@/common/constants/crm/onboarding/onboarding-form-client-error-codes";
import type { QuestionnaireBlockIdentity } from "@/common/contracts/crm/questionnaire/questionnaire-block-identity";
import type { QuestionnaireFixedChoiceLabels } from "@/common/contracts/crm/questionnaire/questionnaire-fixed-choice-labels";
import { detectOnboardingBlockListChange } from "@/common/patterns/crm/onboarding/onboarding-block-list-change";
import { onboardingFormErrorText } from "@/common/patterns/crm/onboarding/onboarding-form-error-text";
import {
  buildOnboardingFormHref,
  readOnboardingFormBlockId,
} from "@/common/patterns/crm/onboarding/onboarding-form-query";
import { questionnaireBlockName } from "@/common/patterns/crm/questionnaire/questionnaire-display-name";
import { OrderedBlockListEditor } from "@/components/workspace/crm/questionnaire/block-list/ordered-block-list-editor/ordered-block-list-editor";
import { QuestionnaireBlockPickerDialog } from "@/components/workspace/crm/questionnaire/block-list/questionnaire-block-picker-dialog/questionnaire-block-picker-dialog";
import { QuestionnaireBlockEditor } from "@/components/workspace/crm/questionnaire/editor/questionnaire-block-editor/questionnaire-block-editor";
import type { Locale } from "@/config/i18n";
import { useVersionedCommand } from "@/hooks/workspace/use-versioned-command";
import type {
  CrmOnboardingDictionary,
  CrmQuestionnaireDictionary,
} from "@/i18n/dictionaries/workspace/crm";
import { OnboardingFieldDeleteDialog } from "../onboarding-field-delete-dialog/onboarding-field-delete-dialog";
import { OnboardingOwnBlockDialog } from "../onboarding-own-block-dialog/onboarding-own-block-dialog";
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
};

const DialogKind = {
  Picker: "picker",
  Own: "own",
  Remove: "remove",
} as const;

type OpenDialog =
  | { kind: typeof DialogKind.Picker }
  | { kind: typeof DialogKind.Own; failure: string | null }
  | { kind: typeof DialogKind.Remove; blockId: string }
  | null;

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
}: OnboardingFormStructureProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const headingRef = useRef<HTMLHeadingElement>(null);
  // The list editor reports the change first and its announcement second.
  const announceListChangeRef = useRef(false);
  const [form, setForm] = useState(initialForm);
  // Version of the newest form the server answered with, for answers that arrive out of order.
  const versionRef = useRef(initialForm.version);
  // Shown while a move is on its way, so focus can follow the moved row at once.
  const [pendingOrder, setPendingOrder] = useState<string[] | null>(null);
  const { busy, run } = useVersionedCommand();
  const [failure, setFailure] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [dialog, setDialog] = useState<OpenDialog>(null);
  const definitionApi = useMemo(
    () => onboardingFormApiService.definitionApi(form.id),
    [form.id],
  );

  const text = content.structure;
  const editable = canWrite && isOnboardingStructureEditable(form.status);
  const errorTexts: OnboardingFormErrorTexts = {
    onboarding: content.errors,
    questionnaire: questionnaireContent.errors,
  };
  const blocks = new Map(
    form.blocks.map((step) => [step.block.id, step.block]),
  );
  const ids = pendingOrder ?? form.blocks.map((step) => step.block.id);
  const selectedId = readOnboardingFormBlockId(
    new URLSearchParams(searchParams.toString()),
  );
  // An id the form does not have opens nothing; it is not an error.
  const selected = selectedId ? blocks.get(selectedId) : undefined;
  const nameOf = (block: QuestionnaireBlockDto) =>
    questionnaireBlockName(block, locale);

  function hrefFor(blockId: string | null): string {
    return buildOnboardingFormHref(pathname, searchParams.toString(), blockId);
  }

  function adopt(next: OnboardingFormDto) {
    versionRef.current = next.version;
    setForm(next);
    onFormChangeAction?.(next);
  }

  /** Shared answer handling of every block list command; null means it did not go through. */
  function settle(
    outcome: VersionedMutationOutcome<
      OnboardingFormDto,
      OnboardingFormClientErrorCode
    >,
  ): OnboardingFormDto | null {
    setPendingOrder(null);
    switch (outcome.kind) {
      case VersionedMutationOutcomeKind.Saved:
        setFailure(null);
        adopt(outcome.value);
        return outcome.value;
      case VersionedMutationOutcomeKind.Conflict:
        adopt(outcome.current);
        setFailure(text.editor.conflict);
        return null;
      case VersionedMutationOutcomeKind.Failure:
        setFailure(onboardingFormErrorText(outcome.code, errorTexts));
        return null;
    }
  }

  async function handleListChange(nextIds: string[]) {
    const change = detectOnboardingBlockListChange(ids, nextIds);
    announceListChangeRef.current =
      change?.kind === OnboardingBlockListChangeKind.Move;
    if (!change || busy) return;
    if (change.kind === OnboardingBlockListChangeKind.Remove) {
      setDialog({ kind: DialogKind.Remove, blockId: change.blockId });
      return;
    }
    setPendingOrder(nextIds);
    settle(
      await run(() =>
        onboardingFormApiService.moveBlock(form.id, change.blockId, {
          direction: change.direction,
          expectedFormVersion: form.version,
        }),
      ),
    );
  }

  async function removeBlock(block: QuestionnaireBlockDto) {
    const outcome = await run(() =>
      onboardingFormApiService.removeBlock(form.id, block.id, {
        expectedFormVersion: form.version,
      }),
    );
    setDialog(null);
    if (!settle(outcome)) return;
    setAnnouncement(
      formatMessage(text.blocks.removed, { name: nameOf(block) }),
    );
    if (selectedId === block.id)
      router.replace(hrefFor(null), { scroll: false });
    // The row that held the focus is gone.
    headingRef.current?.focus();
  }

  async function addCatalogBlock(source: QuestionnaireBlockSummaryDto) {
    if (busy) return;
    const next = settle(
      await run(() =>
        onboardingFormApiService.addBlock(form.id, {
          catalogBlockId: source.id,
          expectedFormVersion: form.version,
        }),
      ),
    );
    if (!next) {
      // The reason is shown on the page, behind the picker.
      setDialog(null);
      return;
    }
    const added = next.blocks.at(-1);
    if (added)
      setAnnouncement(
        formatMessage(text.blocks.added, {
          name: nameOf(added.block),
          position: added.position + 1,
        }),
      );
  }

  async function addOwnBlock(identity: QuestionnaireBlockIdentity) {
    const outcome = await run(() =>
      onboardingFormApiService.addBlock(form.id, {
        key: identity.key,
        translations: { [locale]: { title: identity.title, intro: null } },
        expectedFormVersion: form.version,
      }),
    );
    if (outcome.kind !== VersionedMutationOutcomeKind.Saved) {
      // A conflict loads the current form; the input stays for the next attempt.
      if (outcome.kind === VersionedMutationOutcomeKind.Conflict)
        adopt(outcome.current);
      setDialog({
        kind: DialogKind.Own,
        failure:
          outcome.kind === VersionedMutationOutcomeKind.Conflict
            ? text.editor.conflict
            : onboardingFormErrorText(outcome.code, errorTexts),
      });
      return;
    }
    adopt(outcome.value);
    setFailure(null);
    setDialog(null);
    const added = outcome.value.blocks.at(-1);
    if (!added) return;
    setAnnouncement(
      formatMessage(text.blocks.added, {
        name: nameOf(added.block),
        position: added.position + 1,
      }),
    );
    router.replace(hrefFor(added.block.id), { scroll: false });
  }

  /** A write of the block editor bumped the form version on the server; fetch it. */
  async function handleBlockChange(block: QuestionnaireBlockDto) {
    setForm((current) => ({
      ...current,
      blocks: current.blocks.map((step) =>
        step.block.id === block.id ? { ...step, block } : step,
      ),
    }));
    const read = await onboardingFormApiService.getForm(form.id);
    // A block list command may have answered in between; its form is the newer one.
    if (read.ok && read.value.version >= versionRef.current) adopt(read.value);
  }

  const removing =
    dialog?.kind === DialogKind.Remove ? blocks.get(dialog.blockId) : undefined;
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
              <ButtonControl
                className={styles.addButton}
                disabled={
                  busy || blockCount >= QUESTIONNAIRE_LIMITS.blocksPerOwner
                }
                onClick={() => setDialog({ kind: DialogKind.Picker })}
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
                  setDialog({ kind: DialogKind.Own, failure: null })
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
          onAnnounceAction={(message) => {
            if (announceListChangeRef.current) setAnnouncement(message);
          }}
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

      {editable && dialog?.kind === DialogKind.Picker ? (
        <QuestionnaireBlockPickerDialog
          blocks={catalogBlocks}
          chosenIds={form.blocks.flatMap(
            (step) => step.block.sourceBlockId ?? [],
          )}
          content={text.picker}
          locale={locale}
          onAddAction={(block) => void addCatalogBlock(block)}
          onCloseAction={() => setDialog(null)}
        />
      ) : null}
      {editable && dialog?.kind === DialogKind.Own ? (
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
