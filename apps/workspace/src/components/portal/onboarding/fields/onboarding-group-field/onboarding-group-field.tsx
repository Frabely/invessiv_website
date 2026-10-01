"use client";

import { type ReactNode, useEffect, useId, useRef, useState } from "react";
import {
  faArrowDown,
  faArrowUp,
  faPlus,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { QuestionnaireFieldRequirement } from "@invessiv/common/constants/crm/questionnaire/questionnaire-field-requirements";
import { QUESTIONNAIRE_LIMITS } from "@invessiv/common/constants/crm/questionnaire/questionnaire-limits";
import type { QuestionnaireGroupEntryDto } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-group-entry.dto";
import type { QuestionnaireResolvedField } from "@invessiv/common/contracts/crm/questionnaire/questionnaire-resolved-field";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { ButtonControl, ConfirmDialog, FormFieldLabel } from "@invessiv/ui";
import type { PortalOnboardingDictionary } from "@/i18n/dictionaries/portal";
import styles from "./onboarding-group-field.module.css";

// What the focus lands on inside a new entry: its first control, whatever type it is.
const FIRST_CONTROL = "input, textarea, select, [tabindex='-1']";

const PendingFocusKind = {
  Entry: "entry",
  Moved: "moved",
  Removed: "removed",
} as const;

/** Where the focus belongs once a command changed the list. */
type PendingFocus =
  | { kind: typeof PendingFocusKind.Entry; entryId: string }
  | {
      kind: typeof PendingFocusKind.Moved;
      entryId: string;
      direction: -1 | 1;
    }
  | { kind: typeof PendingFocusKind.Removed; entryId: string };

export type OnboardingGroupFieldProps = {
  /** True while a command of the form is on its way; moving and removing wait for it. */
  busy: boolean;
  /** The entries of this group in display order. */
  entries: readonly QuestionnaireGroupEntryDto[];
  /** Why the last command of this group failed, already worded; null while it is fine. */
  errorMessage: string | null;
  field: QuestionnaireResolvedField;
  /** Whether removing the entry would lose answers or file links; decides on the confirmation. */
  hasContentAction: (entry: QuestionnaireGroupEntryDto) => boolean;
  /** DOM id of the add button; a jump to this field focuses it. */
  id: string;
  /** Adds an entry and returns its id, so the focus can move into it. */
  onAddAction: () => string;
  onMoveAction: (entry: QuestionnaireGroupEntryDto, direction: -1 | 1) => void;
  onRemoveAction: (entry: QuestionnaireGroupEntryDto) => void;
  /** Renders one sub-field for one entry; the group itself knows no field types. */
  renderFieldAction: (
    child: QuestionnaireResolvedField,
    entry: QuestionnaireGroupEntryDto,
  ) => ReactNode;
  texts: PortalOnboardingDictionary["field"]["group"];
};

/**
 * A repeatable set of questions, e.g. one entry per team member. Entries are ruled sections, not
 * cards inside the step. Each has its number, the two move buttons and remove. The keyboard focus
 * follows what happened: into a new entry, along with a moved one, to the add button after a
 * removal.
 */
export function OnboardingGroupField({
  busy,
  entries,
  errorMessage,
  field,
  hasContentAction,
  id,
  onAddAction,
  onMoveAction,
  onRemoveAction,
  renderFieldAction,
  texts,
}: OnboardingGroupFieldProps) {
  const helpId = useId();
  const headingId = useId();
  const frameRef = useRef<HTMLFieldSetElement>(null);
  const focusRef = useRef<PendingFocus | null>(null);
  const [removing, setRemoving] = useState<QuestionnaireGroupEntryDto | null>(
    null,
  );
  const limit = field.maxItems ?? QUESTIONNAIRE_LIMITS.groupEntriesPerField;
  const full = entries.length >= limit;

  useEffect(() => {
    const pending = focusRef.current;
    const frame = frameRef.current;
    if (!pending || !frame) return;
    const present = entries.some((entry) => entry.id === pending.entryId);

    if (pending.kind === PendingFocusKind.Entry) {
      // A new entry is on screen before the server confirmed it; the focus does not wait.
      const control = frame.querySelector<HTMLElement>(
        `[data-entry="${pending.entryId}"] [data-fields] :is(${FIRST_CONTROL})`,
      );
      if (!control) return;
      focusRef.current = null;
      control.focus();
      return;
    }

    // A move or a removal shows once the server answered; until then the focus stays put.
    if (busy) return;
    focusRef.current = null;
    if (pending.kind === PendingFocusKind.Removed) {
      if (!present) frame.querySelector<HTMLElement>("[data-add]")?.focus();
      return;
    }
    // At either end there is no further step that way: the focus goes to the way back.
    [pending.direction, -pending.direction]
      .map((direction) =>
        frame.querySelector<HTMLButtonElement>(
          `[data-entry="${pending.entryId}"] [data-move="${direction}"]`,
        ),
      )
      .find((button) => button && !button.disabled)
      ?.focus();
  }, [busy, entries]);

  function move(entry: QuestionnaireGroupEntryDto, direction: -1 | 1) {
    if (busy) return;
    focusRef.current = {
      kind: PendingFocusKind.Moved,
      entryId: entry.id,
      direction,
    };
    onMoveAction(entry, direction);
  }

  function remove(entry: QuestionnaireGroupEntryDto) {
    if (busy) return;
    focusRef.current = {
      kind: PendingFocusKind.Removed,
      entryId: entry.id,
    };
    onRemoveAction(entry);
  }

  return (
    <fieldset
      aria-describedby={field.help ? helpId : undefined}
      className={styles.group}
      ref={frameRef}
    >
      <legend className={styles.legend}>
        <FormFieldLabel
          label={field.label}
          required={
            field.requirement === QuestionnaireFieldRequirement.Required
          }
        />
      </legend>
      {field.help ? (
        <p className={styles.help} id={helpId}>
          {field.help}
        </p>
      ) : null}
      {entries.length === 0 ? (
        <p className={styles.empty}>{texts.empty}</p>
      ) : (
        <ol className={styles.entries}>
          {entries.map((entry, index) => {
            const number = index + 1;
            const entryHeadingId = `${headingId}-${entry.id}`;
            return (
              <li className={styles.entry} data-entry={entry.id} key={entry.id}>
                <div aria-labelledby={entryHeadingId} role="group">
                  <div className={styles.head}>
                    <h3 className={styles.number} id={entryHeadingId}>
                      {formatMessage(texts.entry, { number })}
                    </h3>
                    {/* While a command runs the buttons stay focusable and only ignore clicks. */}
                    <div className={styles.tools}>
                      <ButtonControl
                        aria-disabled={busy || undefined}
                        aria-label={formatMessage(texts.moveUp, { number })}
                        className={styles.tool}
                        data-move="-1"
                        disabled={index === 0}
                        onClick={() => move(entry, -1)}
                        type="button"
                        variant="ghost"
                      >
                        <FontAwesomeIcon aria-hidden="true" icon={faArrowUp} />
                      </ButtonControl>
                      <ButtonControl
                        aria-disabled={busy || undefined}
                        aria-label={formatMessage(texts.moveDown, { number })}
                        className={styles.tool}
                        data-move="1"
                        disabled={index === entries.length - 1}
                        onClick={() => move(entry, 1)}
                        type="button"
                        variant="ghost"
                      >
                        <FontAwesomeIcon
                          aria-hidden="true"
                          icon={faArrowDown}
                        />
                      </ButtonControl>
                      <ButtonControl
                        aria-disabled={busy || undefined}
                        aria-label={formatMessage(texts.remove, { number })}
                        className={styles.tool}
                        onClick={() => {
                          if (busy) return;
                          if (hasContentAction(entry)) setRemoving(entry);
                          else remove(entry);
                        }}
                        type="button"
                        variant="ghost"
                      >
                        <FontAwesomeIcon aria-hidden="true" icon={faXmark} />
                      </ButtonControl>
                    </div>
                  </div>
                  <div className={styles.fields} data-fields>
                    {field.children.map((child) =>
                      renderFieldAction(child, entry),
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <div className={styles.add}>
        <ButtonControl
          data-add
          disabled={full}
          id={id}
          onClick={() => {
            focusRef.current = {
              kind: PendingFocusKind.Entry,
              entryId: onAddAction(),
            };
          }}
          type="button"
          variant="ghost"
        >
          <FontAwesomeIcon aria-hidden="true" icon={faPlus} />
          {texts.add}
        </ButtonControl>
        {field.maxItems !== null ? (
          <p className={styles.limit}>
            {formatMessage(texts.limit, { max: field.maxItems })}
          </p>
        ) : null}
      </div>
      {errorMessage ? (
        <p className={styles.error} role="alert">
          {errorMessage}
        </p>
      ) : null}
      {removing ? (
        <ConfirmDialog
          cancelLabel={texts.removeDialog.cancel}
          closeLabel={texts.removeDialog.close}
          confirmLabel={texts.removeDialog.confirm}
          description={texts.removeDialog.description}
          onCancelAction={() => setRemoving(null)}
          onConfirmAction={() => {
            remove(removing);
            setRemoving(null);
          }}
          title={texts.removeDialog.title}
          tone="danger"
        />
      ) : null}
    </fieldset>
  );
}
