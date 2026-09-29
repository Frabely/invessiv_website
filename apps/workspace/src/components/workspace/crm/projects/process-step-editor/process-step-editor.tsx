"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  faArrowDown,
  faArrowUp,
  faCommentDots,
  faPlus,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ProjectFieldLimits } from "@invessiv/common/constants/crm/forms/project-field-limits";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonControl } from "@invessiv/ui";
import { ProcessPlanMoveDirection } from "@/common/constants/crm/process-plan-move-directions";
import { ProcessPlanRowKind } from "@/common/constants/crm/process-plan-row-kinds";
import type { ProjectProcessPlan } from "@/common/contracts/crm/project-process-plan";
import type { ProjectProcessPlanRow } from "@/common/contracts/crm/project-process-plan-row";
import {
  addCustomStep,
  insertFeedbackRoundAfter,
  moveProcessPlanRow,
  removeCustomStep,
  removeFeedbackRound,
  renameCustomStep,
  toProcessPlanRows,
} from "@/common/patterns/crm/project-process-plan";
import type { CrmCockpitDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./process-step-editor.module.css";

export type ProcessStepEditorProps = {
  content: CrmCockpitDictionary["projects"];
  plan: ProjectProcessPlan;
  onPlanChangeAction: (plan: ProjectProcessPlan) => void;
};

type PendingFocus = { rowIndex: number; control: string };

const INSERT_CONTROL = "insert";

/**
 * Free-text steps and single feedback rounds in one list. Every round is inserted on its own after a
 * row and can move anywhere; its number follows from the order.
 */
export function ProcessStepEditor({
  content,
  plan,
  onPlanChangeAction,
}: ProcessStepEditorProps) {
  const listRef = useRef<HTMLOListElement>(null);
  const pendingFocusRef = useRef<PendingFocus | null>(null);
  const hintId = useId();
  const countId = useId();
  const [newStep, setNewStep] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const roundContent = content.feedbackRound;
  const rows = toProcessPlanRows(plan);
  const roundCount = plan.feedbackRoundPositions.length;
  const roundsFull = roundCount >= ProjectFieldLimits.FeedbackRoundsMax;
  const countText =
    roundCount === 0
      ? roundContent.countNone
      : roundCount === 1
        ? roundContent.countOne
        : formatMessage(roundContent.countMany, { count: roundCount });

  // Runs after every render: a change re-renders the rows, then focus follows the affected row.
  useEffect(() => {
    const pending = pendingFocusRef.current;
    if (!pending) return;
    pendingFocusRef.current = null;
    const list = listRef.current;
    if (!list) return;
    const rowIndex = Math.min(pending.rowIndex, list.children.length - 1);
    const buttons = [
      ...list.querySelectorAll<HTMLButtonElement>(
        `[data-row-index="${rowIndex}"]`,
      ),
    ].filter((button) => !button.disabled);
    (
      buttons.find((button) => button.dataset.control === pending.control) ??
      buttons[0]
    )?.focus();
  });

  function rowName(row: ProjectProcessPlanRow) {
    if (row.kind === ProcessPlanRowKind.FeedbackRound)
      return formatMessage(roundContent.label, { number: row.roundNumber });
    return (
      row.label.trim() ||
      formatMessage(content.processStepLabel, { position: row.stepIndex + 1 })
    );
  }

  function move(rowIndex: number, direction: ProcessPlanMoveDirection) {
    const row = rows[rowIndex];
    if (!row) return;
    const targetRow =
      direction === ProcessPlanMoveDirection.Up ? rowIndex - 1 : rowIndex + 1;
    const next = moveProcessPlanRow(plan, rowIndex, direction);
    onPlanChangeAction(next);
    setAnnouncement(describeMove(toProcessPlanRows(next), targetRow));
    pendingFocusRef.current = { rowIndex: targetRow, control: direction };
  }

  /** Steps are announced by their step number, rounds by the step they now follow. */
  function describeMove(
    nextRows: readonly ProjectProcessPlanRow[],
    rowIndex: number,
  ) {
    const moved = nextRows[rowIndex];
    if (!moved) return "";
    if (moved.kind === ProcessPlanRowKind.CustomStep)
      return formatMessage(content.processStepMoved, {
        step: rowName(moved),
        position: moved.stepIndex + 1,
      });
    const previousStep = nextRows
      .slice(0, rowIndex)
      .findLast((row) => row.kind === ProcessPlanRowKind.CustomStep);
    return previousStep
      ? formatMessage(roundContent.moved, {
          number: moved.roundNumber,
          step: rowName(previousStep),
        })
      : formatMessage(roundContent.movedToStart, {
          number: moved.roundNumber,
        });
  }

  function insertRoundAfter(rowIndex: number) {
    onPlanChangeAction(insertFeedbackRoundAfter(plan, rowIndex));
    setAnnouncement(roundContent.inserted);
    pendingFocusRef.current = { rowIndex, control: INSERT_CONTROL };
  }

  function remove(row: ProjectProcessPlanRow, rowIndex: number) {
    if (row.kind === ProcessPlanRowKind.FeedbackRound) {
      onPlanChangeAction(removeFeedbackRound(plan, row.roundNumber));
      setAnnouncement(roundContent.removed);
    } else {
      onPlanChangeAction(removeCustomStep(plan, row.stepIndex));
    }
    pendingFocusRef.current = { rowIndex, control: INSERT_CONTROL };
  }

  function addStep() {
    const next = addCustomStep(plan, newStep);
    if (next === plan) return;
    onPlanChangeAction(next);
    setNewStep("");
  }

  function rowActions(row: ProjectProcessPlanRow, rowIndex: number) {
    const name = rowName(row);
    const isRound = row.kind === ProcessPlanRowKind.FeedbackRound;
    const upLabel = isRound
      ? formatMessage(roundContent.moveUp, { round: name })
      : formatMessage(content.moveProcessStepUp, { step: name });
    const downLabel = isRound
      ? formatMessage(roundContent.moveDown, { round: name })
      : formatMessage(content.moveProcessStepDown, { step: name });
    const removeLabel = isRound
      ? formatMessage(roundContent.remove, { round: name })
      : formatMessage(content.removeProcessStep, { step: name });
    const insertLabel = formatMessage(roundContent.insertAfter, { step: name });
    return (
      <span className={styles.actions}>
        <ButtonControl
          aria-label={upLabel}
          className={styles.iconButton}
          data-control={ProcessPlanMoveDirection.Up}
          data-row-index={rowIndex}
          disabled={rowIndex === 0}
          onClick={() => move(rowIndex, ProcessPlanMoveDirection.Up)}
          title={upLabel}
          type="button"
          variant="ghost"
        >
          <FontAwesomeIcon aria-hidden="true" icon={faArrowUp} />
        </ButtonControl>
        <ButtonControl
          aria-label={downLabel}
          className={styles.iconButton}
          data-control={ProcessPlanMoveDirection.Down}
          data-row-index={rowIndex}
          disabled={rowIndex === rows.length - 1}
          onClick={() => move(rowIndex, ProcessPlanMoveDirection.Down)}
          title={downLabel}
          type="button"
          variant="ghost"
        >
          <FontAwesomeIcon aria-hidden="true" icon={faArrowDown} />
        </ButtonControl>
        <ButtonControl
          aria-describedby={roundsFull ? countId : undefined}
          aria-label={insertLabel}
          className={styles.insertRoundButton}
          data-control={INSERT_CONTROL}
          data-row-index={rowIndex}
          disabled={roundsFull}
          onClick={() => insertRoundAfter(rowIndex)}
          title={insertLabel}
          type="button"
          variant="ghost"
        >
          <FontAwesomeIcon aria-hidden="true" icon={faPlus} />
          <span aria-hidden="true">{roundContent.insertShort}</span>
        </ButtonControl>
        <ButtonControl
          aria-label={removeLabel}
          className={styles.iconButton}
          data-row-index={rowIndex}
          disabled={!isRound && plan.steps.length === 1}
          onClick={() => remove(row, rowIndex)}
          title={removeLabel}
          type="button"
          variant="ghost"
        >
          <FontAwesomeIcon aria-hidden="true" icon={faXmark} />
        </ButtonControl>
      </span>
    );
  }

  return (
    <fieldset aria-describedby={hintId} className={styles.editor}>
      <legend className={styles.legend}>{content.processSteps}</legend>
      <p className={styles.count} id={countId}>
        <FontAwesomeIcon aria-hidden="true" icon={faCommentDots} />
        <span>
          {countText}
          {roundsFull
            ? ` ${formatMessage(roundContent.limitReached, {
                max: ProjectFieldLimits.FeedbackRoundsMax,
              })}`
            : null}
        </span>
      </p>
      <ol className={styles.rows} ref={listRef}>
        {rows.map((row, rowIndex) =>
          row.kind === ProcessPlanRowKind.FeedbackRound ? (
            <li className={styles.roundRow} data-kind="feedback" key={row.key}>
              <span aria-hidden="true" className={styles.roundIcon}>
                <FontAwesomeIcon icon={faCommentDots} />
              </span>
              <strong className={styles.roundLabel}>{rowName(row)}</strong>
              {rowActions(row, rowIndex)}
            </li>
          ) : (
            <li className={styles.stepRow} key={row.key}>
              <span aria-hidden="true" className={styles.position}>
                {row.stepIndex + 1}
              </span>
              <input
                aria-label={formatMessage(content.processStepLabel, {
                  position: row.stepIndex + 1,
                })}
                className={styles.stepInput}
                maxLength={ProjectFieldLimits.ProcessStepMaxLength}
                onChange={(event) =>
                  onPlanChangeAction(
                    renameCustomStep(plan, row.stepIndex, event.target.value),
                  )
                }
                required
                value={row.label}
              />
              {rowActions(row, rowIndex)}
            </li>
          ),
        )}
      </ol>
      <div className={styles.addRow}>
        <input
          aria-label={content.newProcessStepLabel}
          className={styles.stepInput}
          disabled={
            plan.steps.length >= ProjectFieldLimits.ProcessStepsMaxCount
          }
          maxLength={ProjectFieldLimits.ProcessStepMaxLength}
          onChange={(event) => setNewStep(event.target.value)}
          onKeyDown={(event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            addStep();
          }}
          placeholder={content.processStepPlaceholder}
          value={newStep}
        />
        <ButtonControl
          className={styles.addButton}
          disabled={
            !newStep.trim() ||
            plan.steps.length >= ProjectFieldLimits.ProcessStepsMaxCount
          }
          onClick={addStep}
          type="button"
          variant="ghost"
        >
          <FontAwesomeIcon aria-hidden="true" icon={faPlus} />
          <span>{content.addProcessStep}</span>
        </ButtonControl>
      </div>
      <small className={styles.hint} id={hintId}>
        {content.processStepsHint}
      </small>
      <p aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </fieldset>
  );
}
