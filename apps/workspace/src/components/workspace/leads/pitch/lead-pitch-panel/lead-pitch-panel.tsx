"use client";

import { useEffect, useId, useState } from "react";
import {
  faArrowUpRightFromSquare,
  faCheck,
  faChevronDown,
  faCopy,
  faRotate,
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PITCH_CHANNEL_LIMITS } from "@invessiv/common/constants/leads/outreach/lead-pitch-channel-limits";
import {
  PITCH_CHANNEL_VALUES,
  type PitchChannel,
} from "@invessiv/common/constants/leads/outreach/lead-pitch-channels";
import { ProfileBridgeErrorCode } from "@invessiv/common/constants/leads/outreach/profile-bridge-error-codes";
import { LeadPitchErrorCode } from "@invessiv/common/constants/leads/outreach/lead-pitch-error-codes";
import type { ProfileSnapshot } from "@invessiv/common/contracts/leads/outreach/profile-snapshot";
import { PITCH_COPY_FEEDBACK_MS } from "@invessiv/common/defaults/leads/outreach/lead-pitch-defaults";
import { copyTextToClipboard } from "@/client/leads/outreach/lead-outreach-clipboard-service";
import { leadStatusClientService } from "@/client/leads/lead-status-client-service";
import type { LeadSocialProfileDto } from "@invessiv/common/contracts/leads/lead-social-profile.dto";
import { LeadPitchJobState } from "@/common/constants/leads/pitch/lead-pitch-job-states";
import {
  LeadPitchPanelVariant,
  type LeadPitchPanelVariant as LeadPitchPanelVariantValue,
} from "@/common/constants/leads/pitch/lead-pitch-panel-variants";
import type { LeadPitchJobErrorCode } from "@/common/contracts/leads/pitch/lead-pitch-job";
import {
  findPitchProfileUrl,
  resolveDefaultPitchChannel,
} from "@/common/patterns/leads/pitch/resolve-pitch-channel";
import type { LeadsPitchDictionary } from "@/i18n/dictionaries/workspace/leads";
import { LeadPitchPasteFallback } from "../lead-pitch-paste-fallback/lead-pitch-paste-fallback";
import { useLeadPitchQueue } from "../lead-pitch-queue-provider/lead-pitch-queue-provider";
import styles from "./lead-pitch-panel.module.css";

const LIMIT_VISIBILITY_THRESHOLD = 2000;

const PASTE_SUGGESTING_ERRORS: LeadPitchJobErrorCode[] = [
  ProfileBridgeErrorCode.NotConfigured,
  ProfileBridgeErrorCode.BridgeMissing,
  ProfileBridgeErrorCode.ProfilePrivate,
  ProfileBridgeErrorCode.ProfileNotFound,
  ProfileBridgeErrorCode.TabNotOpen,
  ProfileBridgeErrorCode.Timeout,
  LeadPitchErrorCode.NoProfileData,
];

type LeadPitchPanelProps = {
  content: LeadsPitchDictionary;
  lead: {
    id: string;
    socialProfiles: LeadSocialProfileDto[];
  };
  onContactedAction?: () => void;
  variant: LeadPitchPanelVariantValue;
};

function formatCounter(
  content: LeadsPitchDictionary,
  count: number,
  limit: number,
): string {
  if (limit > LIMIT_VISIBILITY_THRESHOLD) {
    return content.counter.withoutLimit.replace("{count}", String(count));
  }

  return content.counter.withLimit
    .replace("{count}", String(count))
    .replace("{limit}", String(limit));
}

export function LeadPitchPanel({
  content,
  lead,
  onContactedAction,
  variant,
}: LeadPitchPanelProps) {
  const queue = useLeadPitchQueue();
  const channelGroupId = useId();
  const bodyFieldId = useId();

  const profiles = lead.socialProfiles;

  const [channel, setChannel] = useState<PitchChannel>(() =>
    resolveDefaultPitchChannel(profiles),
  );
  const [isExpanded, setIsExpanded] = useState(
    variant === LeadPitchPanelVariant.Popover,
  );
  const [isPasting, setIsPasting] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [isContacted, setIsContacted] = useState(false);

  const job = queue.getJob(lead.id, channel);
  const profileUrl = findPitchProfileUrl(profiles, channel);
  const limit = PITCH_CHANNEL_LIMITS[channel];
  const isBusy =
    job.state === LeadPitchJobState.Capturing ||
    job.state === LeadPitchJobState.Generating;
  const hasDraft = job.state === LeadPitchJobState.Ready && job.body.length > 0;
  const isOverLimit = job.body.length > limit;
  const fillRatio = Math.min(1, job.body.length / limit);

  useEffect(() => {
    queue.loadLatest(lead.id, channel);
  }, [channel, lead.id, queue]);

  function selectChannel(next: PitchChannel) {
    setHasCopied(false);
    setChannel(next);
  }

  function startGeneration() {
    setIsPasting(false);
    queue.enqueue({
      leadId: lead.id,
      channel,
      handle: null,
      profileUrl,
    });
  }

  function generateFromPaste(snapshot: ProfileSnapshot) {
    setIsPasting(false);
    queue.generateFromSnapshot(
      { leadId: lead.id, channel, handle: null, profileUrl },
      snapshot,
    );
  }

  async function copyBody(): Promise<boolean> {
    try {
      await copyTextToClipboard(job.body);
      setHasCopied(true);
      window.setTimeout(() => setHasCopied(false), PITCH_COPY_FEEDBACK_MS);
      return true;
    } catch {
      return false;
    }
  }

  async function copyAndMarkContacted() {
    const copied = await copyBody();
    if (!copied) {
      return;
    }

    const result = await leadStatusClientService.markContacted(lead.id);
    if (result.ok) {
      setIsContacted(true);
      onContactedAction?.();
    }
  }

  const statusLabel = {
    [LeadPitchJobState.Idle]: content.states.idle,
    [LeadPitchJobState.Capturing]: content.states.capturing,
    [LeadPitchJobState.Generating]: content.states.generating,
    [LeadPitchJobState.Ready]: content.states.ready,
    [LeadPitchJobState.Error]: content.states.error,
  }[job.state];

  const providerLabel = queue.providerStatus.isChecking
    ? content.provider.checking
    : queue.providerStatus.hasOpenAi
      ? `${queue.providerStatus.model ?? content.provider.ready}`
      : content.provider.missing;

  const showPasteOption =
    job.errorCode !== null && PASTE_SUGGESTING_ERRORS.includes(job.errorCode);

  return (
    <section className={styles.panel} data-variant={variant}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>
          <FontAwesomeIcon aria-hidden="true" icon={faWandMagicSparkles} />
          {content.label}
        </span>

        <div
          aria-label={content.channel.switchAriaLabel}
          className={styles.channelGroup}
          id={channelGroupId}
          role="group"
        >
          {PITCH_CHANNEL_VALUES.map((value) => (
            <button
              aria-pressed={channel === value}
              className={styles.channelButton}
              key={value}
              onClick={() => selectChannel(value)}
              type="button"
            >
              {content.channel.labels[value]}
            </button>
          ))}
        </div>

        <span
          aria-live="polite"
          className={styles.provider}
          data-state={
            queue.providerStatus.isChecking
              ? "checking"
              : queue.providerStatus.hasOpenAi
                ? "ready"
                : "missing"
          }
          title={
            queue.providerStatus.hasBridge
              ? content.provider.bridgeReady
              : content.provider.bridgeMissing
          }
        >
          <span aria-hidden="true" className={styles.providerDot} />
          {providerLabel}
        </span>
      </header>

      <div
        aria-label={content.counter.ariaLabel}
        aria-valuemax={limit}
        aria-valuenow={job.body.length}
        className={styles.meter}
        data-busy={isBusy ? "true" : "false"}
        data-over={isOverLimit ? "true" : "false"}
        role="progressbar"
      >
        <span
          className={styles.meterFill}
          style={{ scale: `${fillRatio} 1` }}
        />
      </div>

      <p className={styles.status} aria-live="polite">
        <span>{statusLabel}</span>
        {hasDraft ? (
          <span
            className={styles.counter}
            data-over={isOverLimit ? "true" : "false"}
          >
            {formatCounter(content, job.body.length, limit)}
          </span>
        ) : null}
      </p>

      {!profileUrl && !hasDraft ? (
        <p className={styles.hint}>{content.channel.missingProfile}</p>
      ) : null}

      {job.state === LeadPitchJobState.Error && job.errorCode ? (
        <p className={styles.error} role="alert">
          {content.errors[job.errorCode]}
        </p>
      ) : null}

      {hasDraft ? (
        isExpanded ? (
          <textarea
            className={styles.body}
            id={bodyFieldId}
            onChange={(event) =>
              queue.setBody(lead.id, channel, event.currentTarget.value)
            }
            rows={variant === LeadPitchPanelVariant.Popover ? 14 : 12}
            value={job.body}
          />
        ) : (
          <p className={styles.preview}>{job.body}</p>
        )
      ) : null}

      {isPasting ? (
        <LeadPitchPasteFallback
          channel={channel}
          content={content}
          handle={null}
          onCancelAction={() => setIsPasting(false)}
          onSubmitAction={generateFromPaste}
        />
      ) : null}

      <div className={styles.actions}>
        {hasDraft ? (
          <>
            <button
              className={styles.primaryAction}
              onClick={() => void copyAndMarkContacted()}
              type="button"
            >
              <FontAwesomeIcon
                aria-hidden="true"
                icon={isContacted ? faCheck : faCopy}
              />
              {isContacted
                ? content.buttons.contacted
                : content.buttons.copyAndContact}
            </button>
            <button
              className={styles.action}
              onClick={() => void copyBody()}
              type="button"
            >
              <FontAwesomeIcon aria-hidden="true" icon={faCopy} />
              {hasCopied ? content.buttons.copied : content.buttons.copy}
            </button>
          </>
        ) : null}

        <button
          className={hasDraft ? styles.action : styles.primaryAction}
          disabled={isBusy || !queue.providerStatus.hasOpenAi}
          onClick={startGeneration}
          type="button"
        >
          <FontAwesomeIcon
            aria-hidden="true"
            icon={hasDraft ? faRotate : faWandMagicSparkles}
          />
          {hasDraft ? content.buttons.regenerate : content.buttons.generate}
        </button>

        {hasDraft ? (
          <button
            aria-expanded={isExpanded}
            className={styles.ghostAction}
            onClick={() => setIsExpanded((current) => !current)}
            type="button"
          >
            <FontAwesomeIcon
              aria-hidden="true"
              className={styles.chevron}
              data-expanded={isExpanded ? "true" : "false"}
              icon={faChevronDown}
            />
            {isExpanded ? content.buttons.collapse : content.buttons.expand}
          </button>
        ) : null}

        {showPasteOption && !isPasting ? (
          <button
            className={styles.ghostAction}
            onClick={() => setIsPasting(true)}
            type="button"
          >
            {content.paste.title}
          </button>
        ) : null}

        {profileUrl ? (
          <a
            className={styles.ghostAction}
            href={profileUrl}
            rel="noreferrer noopener"
            target="_blank"
          >
            <FontAwesomeIcon
              aria-hidden="true"
              icon={faArrowUpRightFromSquare}
            />
            {content.buttons.openProfile}
          </a>
        ) : null}
      </div>
    </section>
  );
}
