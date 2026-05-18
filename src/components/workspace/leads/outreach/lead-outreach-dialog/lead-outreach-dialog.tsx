"use client";

import {
  type KeyboardEvent,
  useEffect,
  useId,
  useLayoutEffect,
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
  type OutreachChannel as OutreachChannelValue,
} from "@/common/ai-outreach-generation/outreach-channels";
import {
  OUTREACH_CONTEXT_NOTE_MAX_LEN,
  OUTREACH_CONTEXT_NOTE_ROWS,
  OUTREACH_COPY_FEEDBACK_MS,
  OUTREACH_DEFAULT_CHANNEL,
  OUTREACH_RESULT_TEXTAREA_ROWS,
} from "@/common/ai-outreach-generation/outreach-defaults";
import {
  OutreachCopyTarget,
  type OutreachCopyTarget as OutreachCopyTargetValue,
} from "@/common/ai-outreach-generation/outreach-copy-targets";
import type { GenerateOutreachRequestDto } from "@/common/ai-outreach-generation/generate-outreach-request.dto";
import { OutreachErrorCode } from "@/common/ai-outreach-generation/outreach-error-codes";
import { copyTextToClipboard } from "@/client/leads/outreach/lead-outreach-clipboard-service";
import { outreachGenerationClientService } from "@/client/leads/outreach/lead-outreach-generation-service";
import { outreachProviderStatusService } from "@/client/leads/outreach/lead-outreach-provider-status-service";
import { CHANNEL_PROFILES } from "@/common/ai-outreach-generation/channel-profiles";
import type { LeadsOutreachDictionary } from "@/i18n/dictionaries/workspace/leads";
import { trapDialogFocus } from "../../shared/dialog-focus-trap";
import styles from "./lead-outreach-dialog.module.css";

const LeadOutreachProviderState = {
  Checking: "checking",
  OpenAi: "openai",
  None: "none",
} as const;

type ProviderState =
  (typeof LeadOutreachProviderState)[keyof typeof LeadOutreachProviderState];

type LeadOutreachDialogProps = {
  content: LeadsOutreachDictionary;
  leadDisplayName: string;
  leadId: string;
  onCloseAction: () => void;
  refreshToken: number;
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
    case OutreachErrorCode.NotConfigured:
      return content.errors.notConfigured;
    case OutreachErrorCode.Internal:
      return content.errors.internal;
    default: {
      return content.errors.internal;
    }
  }
}

function getProviderBadgeLabel(
  content: LeadsOutreachDictionary,
  state: ProviderState,
  model: string | null,
): string {
  if (state === LeadOutreachProviderState.Checking) {
    return content.status.checkingProviders;
  }

  if (state === LeadOutreachProviderState.OpenAi) {
    return model
      ? `${content.status.openAiActive} · ${model}`
      : content.status.openAiActive;
  }

  return content.status.noProvider;
}

export function LeadOutreachDialog({
  content,
  leadDisplayName,
  leadId,
  onCloseAction,
  refreshToken,
}: LeadOutreachDialogProps) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDivElement>(null);
  const contextTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const contextId = useId();
  const resultSubjectId = useId();
  const resultBodyId = useId();
  const [selectedChannel, setSelectedChannel] = useState<OutreachChannelValue>(
    OUTREACH_DEFAULT_CHANNEL,
  );
  const [contextNoteLength, setContextNoteLength] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [providerState, setProviderState] = useState<ProviderState>(
    LeadOutreachProviderState.Checking,
  );
  const [openAiModel, setOpenAiModel] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [copiedTarget, setCopiedTarget] =
    useState<OutreachCopyTargetValue | null>(null);
  const hasResult = body.length > 0 || subject.length > 0;
  const channelHint = content.channel.hints[selectedChannel];
  const selectedChannelRequiresSubject =
    CHANNEL_PROFILES[selectedChannel].requiresSubject;
  const shouldRenderSubjectField =
    selectedChannelRequiresSubject || subject.length > 0;
  const counterText = formatCounter(content, contextNoteLength);
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

  useLayoutEffect(() => {
    if (!isMounted) {
      return;
    }

    contextTextareaRef.current?.focus();
  }, [isMounted]);

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    setProviderState(LeadOutreachProviderState.Checking);
    setOpenAiModel(null);

    let cancelled = false;

    outreachProviderStatusService.checkOutreachProviders().then((status) => {
      if (cancelled) return;
      if (status.openai) {
        setProviderState(LeadOutreachProviderState.OpenAi);
        setOpenAiModel(status.openaiModel);
      } else {
        setProviderState(LeadOutreachProviderState.None);
        setOpenAiModel(null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isMounted, refreshToken]);

  const portalRoot = isMounted ? document.body : null;

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    trapDialogFocus(event, event.currentTarget, onCloseAction);
  }

  async function handleGenerate() {
    setErrorMessage(null);
    setCopiedTarget(null);
    setIsGenerating(true);

    const submittedContextNote = contextTextareaRef.current?.value;

    const basePayload: GenerateOutreachRequestDto = {
      leadId,
      channel: selectedChannel,
      ...(submittedContextNote && submittedContextNote.length > 0
        ? { contextNote: submittedContextNote }
        : {}),
    };

    try {
      const result =
        await outreachGenerationClientService.generateOutreachMessage({
          ...basePayload,
        });

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

            <span
              className={styles.providerBadge}
              data-state={providerState}
              aria-live="polite"
            >
              <span aria-hidden="true" className={styles.providerDot} />
              {getProviderBadgeLabel(content, providerState, openAiModel)}
            </span>

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

            <label className={styles.field} htmlFor={contextId}>
              <span className={styles.label}>{content.contextNote.label}</span>
              <textarea
                className={styles.textarea}
                id={contextId}
                maxLength={OUTREACH_CONTEXT_NOTE_MAX_LEN}
                autoFocus
                defaultValue=""
                onChange={(event) =>
                  setContextNoteLength(event.currentTarget.value.length)
                }
                placeholder={content.contextNote.placeholder}
                ref={contextTextareaRef}
                rows={OUTREACH_CONTEXT_NOTE_ROWS}
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
                {shouldRenderSubjectField ? (
                  <div className={styles.resultField}>
                    <span className={styles.resultHeader}>
                      <label htmlFor={resultSubjectId}>
                        {content.result.subjectLabel}
                      </label>
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
                      id={resultSubjectId}
                      onChange={(event) =>
                        setSubject(event.currentTarget.value)
                      }
                      placeholder={content.result.subjectPlaceholder}
                      value={subject}
                    />
                  </div>
                ) : null}

                <div className={styles.resultField}>
                  <span className={styles.resultHeader}>
                    <label htmlFor={resultBodyId}>
                      {content.result.bodyLabel}
                    </label>
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
                    id={resultBodyId}
                    onChange={(event) => setBody(event.currentTarget.value)}
                    placeholder={content.result.bodyPlaceholder}
                    rows={
                      selectedChannelRequiresSubject
                        ? OUTREACH_RESULT_TEXTAREA_ROWS.Email
                        : OUTREACH_RESULT_TEXTAREA_ROWS.Default
                    }
                    value={body}
                  />
                </div>
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
