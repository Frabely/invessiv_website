"use client";

import { type RefObject, useEffect, useRef, useState } from "react";

import type { QuestionnaireErrorCode } from "@invessiv/common/constants/crm/errors/questionnaire-error-codes";
import type { QuestionnaireBlockDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-block.dto";
import type { QuestionnaireFieldDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-field.dto";
import type { Locale } from "@invessiv/common/contracts/i18n/locale";
import {
  findQuestionnaireField,
  questionnaireFieldLevel,
} from "@invessiv/common/patterns/crm/questionnaire/questionnaire-block-structure";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { VersionedMutationOutcomeKind } from "@/common/constants/client/versioned-mutation-outcome-kinds";
import type { VersionedMutationOutcome } from "@/common/contracts/client/versioned-mutation-outcome";
import type { QuestionnaireDefinitionClientApi } from "@/common/contracts/crm/questionnaire/questionnaire-definition-client-api";
import { questionnaireFieldName } from "@/common/patterns/crm/questionnaire/questionnaire-display-name";
import { useVersionedCommand } from "@/hooks/workspace/use-versioned-command";
import type { CrmQuestionnaireDictionary } from "@/i18n/dictionaries/workspace/crm";

/**
 * The block of the editor and the writes on its field list (move, remove) plus what the field
 * dialog hands back. Every write answers with the whole block, which replaces the local one; a
 * conflict adopts the current block. After a move, focus follows the row so keyboard users can go on.
 */
export function useQuestionnaireBlockCommands(options: {
  api: QuestionnaireDefinitionClientApi;
  initialBlock: QuestionnaireBlockDto;
  content: CrmQuestionnaireDictionary;
  locale: Locale;
  /** The element that holds the field rows, searched for the moved row. */
  listRef: RefObject<HTMLElement | null>;
  /** Called after every accepted write, e.g. to refresh counts outside the editor. */
  onBlockChangeAction?: (block: QuestionnaireBlockDto) => void;
  /** The delete dialog closes as soon as the server has answered. */
  onDeleteAnsweredAction: () => void;
}) {
  const {
    api,
    initialBlock,
    content,
    locale,
    listRef,
    onBlockChangeAction,
    onDeleteAnsweredAction,
  } = options;
  const [block, setBlock] = useState(initialBlock);
  const { busy, run } = useVersionedCommand();
  const [failure, setFailure] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const pendingFocusRef = useRef<{ fieldId: string; control: string } | null>(
    null,
  );
  const text = content.editor.fields;
  const name = (field: QuestionnaireFieldDto) =>
    questionnaireFieldName(field, locale, text.untitled);

  // Focus follows a moved row, so keyboard users can keep moving it.
  useEffect(() => {
    const pending = pendingFocusRef.current;
    if (!pending) return;
    pendingFocusRef.current = null;
    const row = listRef.current?.querySelector(
      `[data-field-id="${pending.fieldId}"]`,
    );
    const buttons = [
      ...(row?.querySelectorAll<HTMLButtonElement>("button[data-control]") ??
        []),
    ];
    (
      buttons.find(
        (button) =>
          button.dataset.control === pending.control && !button.disabled,
      ) ?? buttons.find((button) => !button.disabled)
    )?.focus();
  });

  function adopt(next: QuestionnaireBlockDto) {
    setBlock(next);
    onBlockChangeAction?.(next);
  }

  /** Shared answer handling of every list action; the dialog keeps its own. */
  function settle(
    outcome: VersionedMutationOutcome<
      QuestionnaireBlockDto,
      QuestionnaireErrorCode
    >,
    success: (next: QuestionnaireBlockDto) => void,
  ) {
    switch (outcome.kind) {
      case VersionedMutationOutcomeKind.Saved:
        setFailure(null);
        adopt(outcome.value);
        success(outcome.value);
        return;
      case VersionedMutationOutcomeKind.Conflict:
        adopt(outcome.current);
        setFailure(content.editor.conflict);
        return;
      case VersionedMutationOutcomeKind.Failure:
        setFailure(content.errors[outcome.code]);
    }
  }

  async function move(field: QuestionnaireFieldDto, direction: -1 | 1) {
    const outcome = await run(() =>
      api.moveField(field.id, {
        direction,
        expectedBlockVersion: block.version,
      }),
    );
    settle(outcome, (next) => {
      const moved = findQuestionnaireField(next, field.id);
      if (!moved) return;
      setAnnouncement(
        formatMessage(text.moved, {
          name: name(moved),
          position: moved.position + 1,
        }),
      );
      pendingFocusRef.current = {
        fieldId: field.id,
        control: direction === -1 ? "up" : "down",
      };
    });
  }

  async function removeField(field: QuestionnaireFieldDto) {
    const outcome = await run(() =>
      api.deleteField(field.id, { expectedBlockVersion: block.version }),
    );
    onDeleteAnsweredAction();
    settle(outcome, () =>
      setAnnouncement(formatMessage(text.removed, { name: name(field) })),
    );
  }

  /** The field dialog wrote the block; the list follows and says what happened. */
  function handleFieldSaved(
    next: QuestionnaireBlockDto,
    field: QuestionnaireFieldDto | null,
    parentFieldId: string | null,
  ) {
    adopt(next);
    const saved = field
      ? findQuestionnaireField(next, field.id)
      : questionnaireFieldLevel(next, parentFieldId).at(-1);
    if (saved)
      setAnnouncement(
        formatMessage(field ? text.updated : text.added, { name: name(saved) }),
      );
  }

  return {
    adopt,
    announcement,
    block,
    busy,
    failure,
    handleFieldSaved,
    move,
    name,
    removeField,
  };
}
