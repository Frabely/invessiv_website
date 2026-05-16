"use client";

import {
  type KeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  faCopy,
  faWandMagicSparkles,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  OUTREACH_CHANNEL_VALUES,
  OutreachChannel,
  type OutreachChannel as OutreachChannelValue,
} from "@/common/ai-outreach-generation/outreach-channels";
import {
  OUTREACH_CONTEXT_NOTE_MAX_LEN,
  OUTREACH_CONTEXT_NOTE_ROWS,
  OUTREACH_COPY_FEEDBACK_MS,
  OUTREACH_DEFAULT_CHANNEL,
  OUTREACH_DEFAULT_PROMPT_KEY,
  OUTREACH_RESULT_TEXTAREA_ROWS,
} from "@/common/ai-outreach-generation/outreach-defaults";
import {
  OutreachCopyTarget,
  type OutreachCopyTarget as OutreachCopyTargetValue,
} from "@/common/ai-outreach-generation/outreach-copy-targets";
import type { GenerateOutreachRequestDto } from "@/common/ai-outreach-generation/generate-outreach-request.dto";
import { OutreachErrorCode } from "@/common/ai-outreach-generation/outreach-error-codes";
import {
  OUTREACH_PROMPT_KEY_VALUES,
  type OutreachPromptKey,
} from "@/common/ai-outreach-generation/outreach-prompt-keys";
import { copyTextToClipboard } from "@/client/leads/outreach/lead-outreach-clipboard-service";
import { generateOutreachMessage } from "@/client/leads/outreach/lead-outreach-generation-service";
import type { LeadsOutreachDictionary } from "@/i18n/dictionaries/workspace/leads";
import { trapDialogFocus } from "../../shared/dialog-focus-trap";
import styles from "./lead-outreach-dialog.module.css";

type LeadOutreachDialogProps = {
  content: LeadsOutreachDictionary;
  leadDisplayName: string;
  leadId: string;
  leadImprovements?: string[] | null;
  onCloseAction: () => void;
};

const OutreachDialogId = {
  Description: "lead-outreach-dialog-description",
  Title: "lead-outreach-dialog-title",
} as const;

function formatCounter(
  content: LeadsOutreachDictionary,
  count: number,
): string {
  return content.contextNote.counterLabel
    .replace("{count}", String(count))
    .replace("{max}", String(OUTREACH_CONTEXT_NOTE_MAX_LEN));
}

function getErrorMessage(
  content: LeadsOutreachDictionary,
  code: OutreachErrorCode,
): string {
  switch (code) {
    case OutreachErrorCode.ValidationError:
      return content.errors.validation;
    case OutreachErrorCode.LeadNotFound:
      return content.errors.leadNotFound;
    case OutreachErrorCode.ProviderUnavailable:
      return content.errors.providerUnavailable;
    case OutreachErrorCode.Internal:
      return content.errors.internal;
    default: {
      return content.errors.internal;
    }
  }
}

export function LeadOutreachDialog({
  content,
  leadDisplayName,
  leadId,
  leadImprovements,
  onCloseAction,
}: LeadOutreachDialogProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const promptId = useId();
  const contextId = useId();
  const hasKnownImprovements = Array.isArray(leadImprovements);
  const hasImprovements =
    !hasKnownImprovements || (leadImprovements?.length ?? 0) > 0;
  const [selectedPromptKey, setSelectedPromptKey] = useState<OutreachPromptKey>(
    OUTREACH_DEFAULT_PROMPT_KEY,
  );
  const [selectedChannel, setSelectedChannel] = useState<OutreachChannelValue>(
    OUTREACH_DEFAULT_CHANNEL,
  );
  const [includeImprovements, setIncludeImprovements] =
    useState(hasImprovements);
  const [contextNote, setContextNote] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [copiedTarget, setCopiedTarget] =
    useState<OutreachCopyTargetValue | null>(null);
  const hasResult = body.length > 0 || subject.length > 0;
  const channelHint = content.channel.hints[selectedChannel];
  const promptDescription = content.prompt.descriptions[selectedPromptKey];
  const counterText = formatCounter(content, contextNote.length);
  const generateLabel = hasResult
    ? content.buttons.regenerate
    : content.buttons.generate;

  const channelOptions = useMemo(
    () =>
      OUTREACH_CHANNEL_VALUES.map((channel) => ({
        label: content.channel.labels[channel],
        value: channel,
      })),
    [content.channel.labels],
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      dialogRef.current
        ?.querySelector<
          HTMLButtonElement | HTMLSelectElement | HTMLTextAreaElement
        >("button, select, textarea")
        ?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [isMounted]);

  const portalRoot = isMounted ? document.body : null;

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    trapDialogFocus(event, event.currentTarget, onCloseAction);
  }

  async function handleGenerate() {
    setErrorMessage(null);
    setCopiedTarget(null);
    setIsGenerating(true);

    const payload: GenerateOutreachRequestDto = {
      leadId,
      promptKey: selectedPromptKey,
      channel: selectedChannel,
      includeImprovements: includeImprovements && hasImprovements,
      ...(contextNote.trim() ? { contextNote: contextNote.trim() } : {}),
    };

    try {
      const result = await generateOutreachMessage(payload);

      if (!result.ok) {
        setErrorMessage(getErrorMessage(content, result.code));
        return;
      }

      setSubject(result.subject ?? "");
      setBody(result.body);
      router.refresh();
    } catch {
      setErrorMessage(content.errors.internal);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleCopy(target: OutreachCopyTargetValue, value: string) {
    try {
      await copyTextToClipboard(value);
      setCopiedTarget(target);
      window.setTimeout(() => setCopiedTarget(null), OUTREACH_COPY_FEEDBACK_MS);
    } catch {
      setErrorMessage(content.errors.internal);
    }
  }

  const dialog = (
    <div className={styles.overlay} role="presentation">
      <div
        aria-describedby={OutreachDialogId.Description}
        aria-labelledby={OutreachDialogId.Title}
        aria-modal="true"
        className={styles.dialog}
        onKeyDown={handleKeyDown}
        ref={dialogRef}
        role="dialog"
      >
        <header className={styles.header}>
          <div className={styles.heading}>
            <p className={styles.eyebrow}>{content.dialog.eyebrow}</p>
            <h2 className={styles.title} id={OutreachDialogId.Title}>
              {content.dialog.title}
            </h2>
            <p className={styles.description} id={OutreachDialogId.Description}>
              {content.dialog.description}
            </p>
          </div>

          <button
            aria-label={content.dialog.closeAriaLabel}
            className={styles.closeButton}
            onClick={onCloseAction}
            title={content.dialog.closeAriaLabel}
            type="button"
          >
            <FontAwesomeIcon aria-hidden="true" icon={faXmark} />
          </button>
        </header>

        <div className={styles.body}>
          <section
            className={styles.controls}
            aria-label={content.dialog.title}
          >
            <div className={styles.leadCard}>
              <span className={styles.leadCardLabel}>
                {content.status.ready}
              </span>
              <strong>{leadDisplayName}</strong>
            </div>

            <label className={styles.field} htmlFor={promptId}>
              <span className={styles.label}>{content.prompt.label}</span>
              <select
                className={styles.select}
                id={promptId}
                onChange={(event) =>
                  setSelectedPromptKey(event.target.value as OutreachPromptKey)
                }
                value={selectedPromptKey}
              >
                {OUTREACH_PROMPT_KEY_VALUES.map((promptKey) => (
                  <option key={promptKey} value={promptKey}>
                    {content.prompt.descriptions[promptKey]}
                  </option>
                ))}
              </select>
              <span className={styles.helpText}>{promptDescription}</span>
            </label>

            <div className={styles.field}>
              <span className={styles.label}>{content.channel.label}</span>
              <div className={styles.segmented} role="group">
                {channelOptions.map((channel) => (
                  <button
                    aria-pressed={selectedChannel === channel.value}
                    className={styles.segment}
                    data-active={
                      selectedChannel === channel.value ? "true" : "false"
                    }
                    key={channel.value}
                    onClick={() => setSelectedChannel(channel.value)}
                    type="button"
                  >
                    {channel.label}
                  </button>
                ))}
              </div>
              <span className={styles.helpText}>{channelHint}</span>
            </div>

            <label
              className={styles.toggleRow}
              title={!hasImprovements ? content.improvements.disabledHint : ""}
            >
              <input
                checked={includeImprovements && hasImprovements}
                className={styles.toggleInput}
                disabled={!hasImprovements}
                onChange={(event) =>
                  setIncludeImprovements(event.currentTarget.checked)
                }
                type="checkbox"
              />
              <span aria-hidden="true" className={styles.toggleTrack}>
                <span className={styles.toggleKnob} />
              </span>
              <span className={styles.toggleText}>
                <strong>{content.improvements.label}</strong>
                <small>
                  {hasImprovements
                    ? content.improvements.help
                    : content.improvements.disabledHint}
                </small>
              </span>
            </label>

            <label className={styles.field} htmlFor={contextId}>
              <span className={styles.label}>{content.contextNote.label}</span>
              <textarea
                className={styles.textarea}
                id={contextId}
                maxLength={OUTREACH_CONTEXT_NOTE_MAX_LEN}
                onChange={(event) => setContextNote(event.target.value)}
                placeholder={content.contextNote.placeholder}
                rows={OUTREACH_CONTEXT_NOTE_ROWS}
                value={contextNote}
              />
              <span className={styles.counter}>{counterText}</span>
            </label>

            {errorMessage ? (
              <p className={styles.error} role="alert">
                {errorMessage}
              </p>
            ) : null}

            <button
              className={styles.generateButton}
              disabled={isGenerating}
              onClick={handleGenerate}
              type="button"
            >
              <FontAwesomeIcon aria-hidden="true" icon={faWandMagicSparkles} />
              {isGenerating ? content.status.generating : generateLabel}
            </button>
          </section>

          <section className={styles.resultPanel} aria-live="polite">
            {hasResult ? (
              <>
                {selectedChannel === OutreachChannel.Email ? (
                  <label className={styles.resultField}>
                    <span className={styles.resultHeader}>
                      <span>{content.result.subjectLabel}</span>
                      <button
                        className={styles.copyButton}
                        disabled={!subject}
                        onClick={() =>
                          handleCopy(OutreachCopyTarget.Subject, subject)
                        }
                        type="button"
                      >
                        <FontAwesomeIcon aria-hidden="true" icon={faCopy} />
                        {copiedTarget === OutreachCopyTarget.Subject
                          ? content.buttons.copied
                          : content.buttons.copy}
                      </button>
                    </span>
                    <input
                      className={styles.resultInput}
                      onChange={(event) => setSubject(event.target.value)}
                      placeholder={content.result.subjectPlaceholder}
                      value={subject}
                    />
                  </label>
                ) : null}

                <label className={styles.resultField}>
                  <span className={styles.resultHeader}>
                    <span>{content.result.bodyLabel}</span>
                    <button
                      className={styles.copyButton}
                      disabled={!body}
                      onClick={() => handleCopy(OutreachCopyTarget.Body, body)}
                      type="button"
                    >
                      <FontAwesomeIcon aria-hidden="true" icon={faCopy} />
                      {copiedTarget === OutreachCopyTarget.Body
                        ? content.buttons.copied
                        : content.buttons.copy}
                    </button>
                  </span>
                  <textarea
                    className={styles.resultTextarea}
                    onChange={(event) => setBody(event.target.value)}
                    placeholder={content.result.bodyPlaceholder}
                    rows={
                      selectedChannel === OutreachChannel.Email
                        ? OUTREACH_RESULT_TEXTAREA_ROWS.Email
                        : OUTREACH_RESULT_TEXTAREA_ROWS.Default
                    }
                    value={body}
                  />
                </label>
              </>
            ) : (
              <div className={styles.emptyState}>
                <FontAwesomeIcon
                  aria-hidden="true"
                  icon={faWandMagicSparkles}
                />
                <p>{content.result.emptyState}</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );

  if (!portalRoot) {
    return null;
  }

  return createPortal(dialog, portalRoot);
}
