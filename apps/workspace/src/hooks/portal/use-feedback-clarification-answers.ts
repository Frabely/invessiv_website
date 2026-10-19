"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FEEDBACK_LIMITS } from "@invessiv/common/constants/crm/feedback-limits";
import { PortalFeedbackErrorCode } from "@invessiv/common/constants/portal/portal-feedback-error-codes";
import type { PortalFeedbackItemDto } from "@invessiv/common/contracts/portal/portal-feedback-item.dto";
import { findOpenFeedbackClarification } from "@invessiv/common/patterns/crm/find-open-feedback-clarification";
import { portalFeedbackApiService } from "@/client/portal/portal-feedback-api-service";
import { FeedbackAnswerProblem } from "@/common/constants/portal/feedback-answer-problems";
import type { FeedbackAnswerDraft } from "@/common/contracts/portal/feedback-answer-draft";

type Drafts = ReadonlyMap<string, FeedbackAnswerDraft>;

function isQuestionOpen(item: PortalFeedbackItemDto, clarificationId: string) {
  return (
    findOpenFeedbackClarification(item.clarifications)?.id === clarificationId
  );
}

function locked(draft: FeedbackAnswerDraft): FeedbackAnswerDraft {
  return {
    ...draft,
    busy: false,
    locked: true,
    problem: FeedbackAnswerProblem.NotOpen,
  };
}

function withDraft(
  drafts: Drafts,
  clarificationId: string,
  next: FeedbackAnswerDraft | null,
): Drafts {
  const copy = new Map(drafts);
  if (next) copy.set(clarificationId, next);
  else copy.delete(clarificationId);
  return copy;
}

/**
 * Answers to the questions of one round, typed directly on the items. Drafts are kept per question,
 * so a refresh or a conflict on one item never discards what was typed on another, and an answer
 * stays bound to the question it was written for. Mount it per customer and round.
 */
export function useFeedbackClarificationAnswers(
  customerId: string,
  roundId: string,
  onAnsweredAction: (itemId: string) => void,
) {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Drafts>(new Map());
  const [latest, setLatest] = useState<
    ReadonlyMap<string, PortalFeedbackItemDto>
  >(new Map());

  function adopt(item: PortalFeedbackItemDto) {
    setLatest((current) => new Map(current).set(item.id, item));
  }

  /** The item as the last answer saw it, until the refreshed page brings a newer one. */
  function itemFor(item: PortalFeedbackItemDto): PortalFeedbackItemDto {
    const local = latest.get(item.id);
    return local && local.version > item.version ? local : item;
  }

  function draftFor(clarificationId: string): FeedbackAnswerDraft | null {
    return drafts.get(clarificationId) ?? null;
  }

  /**
   * Typed answers whose question is no longer the open one, shown locked so the text is not lost.
   * A refresh can finish a question without a response for its draft, so this reads the item, not
   * only the drafts already marked as locked. Empty drafts have nothing to keep.
   */
  function staleDraftsOf(
    itemId: string,
    openClarificationId: string | null,
  ): FeedbackAnswerDraft[] {
    return [...drafts.values()]
      .filter(
        (draft) =>
          draft.itemId === itemId &&
          draft.clarificationId !== openClarificationId &&
          draft.text.trim() !== "",
      )
      .map(locked);
  }

  function change(itemId: string, clarificationId: string, text: string) {
    setDrafts((current) => {
      const previous = current.get(clarificationId);
      if (previous?.busy || previous?.locked) return current;
      return withDraft(current, clarificationId, {
        itemId,
        clarificationId,
        text,
        // A changed text is a new action; only an unchanged retry may reuse the id.
        commandId: crypto.randomUUID(),
        busy: false,
        locked: false,
        problem: null,
        code: null,
      });
    });
  }

  function discard(clarificationId: string) {
    setDrafts((current) => withDraft(current, clarificationId, null));
  }

  function update(
    clarificationId: string,
    patch: (draft: FeedbackAnswerDraft) => FeedbackAnswerDraft,
  ) {
    setDrafts((current) => {
      const previous = current.get(clarificationId);
      return previous
        ? withDraft(current, clarificationId, patch(previous))
        : current;
    });
  }

  async function submit(item: PortalFeedbackItemDto, clarificationId: string) {
    const draft = drafts.get(clarificationId);
    const text = draft?.text.trim() ?? "";
    if (draft?.busy || draft?.locked) return;
    if (!isQuestionOpen(itemFor(item), clarificationId)) {
      update(clarificationId, locked);
      return;
    }
    if (!draft || text === "" || text.length > FEEDBACK_LIMITS.noteMaxLength) {
      setDrafts((current) =>
        withDraft(current, clarificationId, {
          itemId: item.id,
          clarificationId,
          text: draft?.text ?? "",
          commandId: draft?.commandId ?? crypto.randomUUID(),
          busy: false,
          locked: false,
          problem:
            text === ""
              ? FeedbackAnswerProblem.Required
              : FeedbackAnswerProblem.TooLong,
          code: null,
        }),
      );
      return;
    }
    update(clarificationId, (previous) => ({
      ...previous,
      busy: true,
      problem: null,
      code: null,
    }));
    const result = await portalFeedbackApiService.answerClarification(
      customerId,
      { roundId, itemId: item.id, clarificationId },
      {
        commandId: draft.commandId,
        version: itemFor(item).version,
        answer: text,
      },
    );
    if (result.ok) {
      if (result.item) adopt(result.item);
      discard(clarificationId);
      onAnsweredAction(item.id);
      router.refresh();
      return;
    }
    if ("current" in result) {
      adopt(result.current);
      update(clarificationId, (previous) =>
        result.code === PortalFeedbackErrorCode.ClarificationNotOpen ||
        !isQuestionOpen(result.current, clarificationId)
          ? locked(previous)
          : {
              ...previous,
              busy: false,
              problem: FeedbackAnswerProblem.Conflict,
              commandId: crypto.randomUUID(),
            },
      );
      // The rest of the page (notice, other items) has to catch up with the adopted item.
      router.refresh();
      return;
    }
    // Without read access the refusal carries no current item; the refreshed page brings it.
    if (result.code === PortalFeedbackErrorCode.ClarificationNotOpen) {
      update(clarificationId, (previous) => ({
        ...locked(previous),
        code: result.code,
      }));
      router.refresh();
      return;
    }
    update(clarificationId, (previous) => ({
      ...previous,
      busy: false,
      problem: FeedbackAnswerProblem.Failure,
      code: result.code,
    }));
  }

  return { itemFor, draftFor, staleDraftsOf, change, discard, submit };
}
