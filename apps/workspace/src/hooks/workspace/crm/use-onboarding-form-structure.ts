"use client";

import { useRef, useState } from "react";

import type { OnboardingFormDto } from "@invessiv/common/contracts/crm/onboarding/onboarding-form.dto";
import type { QuestionnaireBlockSummaryDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block-summary.dto";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { onboardingFormApiService } from "@/client/crm/onboarding-form-api-service";
import { VersionedMutationOutcomeKind } from "@/common/constants/client/versioned-mutation-outcome-kinds";
import { OnboardingBlockListChangeKind } from "@/common/constants/crm/onboarding/onboarding-block-list-change-kinds";
import type { OnboardingFormClientErrorCode } from "@/common/constants/crm/onboarding/onboarding-form-client-error-codes";
import { OnboardingStructureDialogKind } from "@/common/constants/crm/onboarding/onboarding-structure-dialog-kinds";
import type { VersionedMutationOutcome } from "@/common/contracts/client/versioned-mutation-outcome";
import type { OnboardingFormErrorTexts } from "@/common/contracts/crm/onboarding/onboarding-form-error-texts";
import type { OnboardingStructureDialog } from "@/common/contracts/crm/onboarding/onboarding-structure-dialog";
import type { QuestionnaireBlockIdentity } from "@/common/contracts/crm/questionnaire/questionnaire-block-identity";
import { detectOnboardingBlockListChange } from "@/common/patterns/crm/onboarding/onboarding-block-list-change";
import { onboardingFormErrorText } from "@/common/patterns/crm/onboarding/onboarding-form-error-text";
import { questionnaireBlockName } from "@/common/patterns/crm/questionnaire/questionnaire-display-name";
import type { Locale } from "@/config/i18n";
import { useVersionedCommand } from "@/hooks/workspace/use-versioned-command";
import type { CrmOnboardingDictionary } from "@/i18n/dictionaries/workspace/crm";

/**
 * The state and the commands of the structure tab of a form: the form itself, the block list
 * commands against its version, the dialogs and what screen readers are told. Where the page goes
 * afterwards (selection, focus) stays with the component, which passes it in.
 */
export function useOnboardingFormStructure(options: {
  initialForm: OnboardingFormDto;
  locale: Locale;
  text: CrmOnboardingDictionary["structure"];
  errorTexts: OnboardingFormErrorTexts;
  /** Called with every form the server answers with, e.g. to keep the page head in step. */
  onFormChangeAction?: (form: OnboardingFormDto) => void;
  /** The tab opens this block. */
  onSelectAction: (blockId: string) => void;
  /** A block is gone, and the row that held the focus with it. */
  onRemovedAction: (block: QuestionnaireBlockDto) => void;
}) {
  const {
    initialForm,
    locale,
    text,
    errorTexts,
    onFormChangeAction,
    onSelectAction,
    onRemovedAction,
  } = options;
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
  const [dialog, setDialog] = useState<OnboardingStructureDialog>(null);

  const ids = pendingOrder ?? form.blocks.map((step) => step.block.id);
  const nameOf = (block: QuestionnaireBlockDto) =>
    questionnaireBlockName(block, locale);

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

  function announceAdded(next: OnboardingFormDto) {
    const added = next.blocks.at(-1);
    if (!added) return null;
    setAnnouncement(
      formatMessage(text.blocks.added, {
        name: nameOf(added.block),
        position: added.position + 1,
      }),
    );
    return added;
  }

  /** Only a move is announced by the list editor; a removal asks first and says so itself. */
  function announceListMessage(message: string) {
    if (announceListChangeRef.current) setAnnouncement(message);
  }

  async function handleListChange(nextIds: string[]) {
    const change = detectOnboardingBlockListChange(ids, nextIds);
    announceListChangeRef.current =
      change?.kind === OnboardingBlockListChangeKind.Move;
    if (!change || busy) return;
    if (change.kind === OnboardingBlockListChangeKind.Remove) {
      setDialog({
        kind: OnboardingStructureDialogKind.Remove,
        blockId: change.blockId,
      });
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
    onRemovedAction(block);
  }

  async function addCatalogBlocks(
    sources: readonly QuestionnaireBlockSummaryDto[],
  ): Promise<boolean> {
    if (busy || sources.length === 0) return false;
    const outcome = await run(() =>
      onboardingFormApiService.addBlock(form.id, {
        catalogBlockIds: sources.map((source) => source.id),
        expectedFormVersion: form.version,
      }),
    );
    if (outcome.kind !== VersionedMutationOutcomeKind.Saved) {
      if (outcome.kind === VersionedMutationOutcomeKind.Conflict)
        adopt(outcome.current);
      setDialog({
        kind: OnboardingStructureDialogKind.Picker,
        failure:
          outcome.kind === VersionedMutationOutcomeKind.Conflict
            ? text.editor.conflict
            : onboardingFormErrorText(outcome.code, errorTexts),
      });
      return false;
    }
    adopt(outcome.value);
    setFailure(null);
    setDialog(null);
    if (sources.length === 1) announceAdded(outcome.value);
    else
      setAnnouncement(
        formatMessage(text.blocks.addedMany, { count: sources.length }),
      );
    return true;
  }

  async function applyTemplate(templateId: string): Promise<boolean> {
    if (busy) return false;
    const outcome = await run(() =>
      onboardingFormApiService.applyTemplate(form.id, {
        templateId,
        expectedFormVersion: form.version,
      }),
    );
    if (outcome.kind !== VersionedMutationOutcomeKind.Saved) {
      if (outcome.kind === VersionedMutationOutcomeKind.Conflict)
        adopt(outcome.current);
      setDialog({
        kind: OnboardingStructureDialogKind.Template,
        failure:
          outcome.kind === VersionedMutationOutcomeKind.Conflict
            ? text.editor.conflict
            : onboardingFormErrorText(outcome.code, errorTexts),
      });
      return false;
    }
    adopt(outcome.value);
    setFailure(null);
    setDialog(null);
    setAnnouncement(
      formatMessage(text.blocks.addedMany, {
        count: outcome.value.blocks.length,
      }),
    );
    return true;
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
        kind: OnboardingStructureDialogKind.Own,
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
    const added = announceAdded(outcome.value);
    if (added) onSelectAction(added.block.id);
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

  return {
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
  };
}
