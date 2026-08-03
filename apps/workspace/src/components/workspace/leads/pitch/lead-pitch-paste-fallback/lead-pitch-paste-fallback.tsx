"use client";

import { useId, useState } from "react";
import type { PitchChannel } from "@invessiv/common/constants/leads/outreach/lead-pitch-channels";
import { ProfileSnapshotSource } from "@invessiv/common/constants/leads/outreach/profile-snapshot-sources";
import type { ProfileSnapshot } from "@invessiv/common/contracts/leads/outreach/profile-snapshot";
import { PITCH_PASTE_MAX_LEN } from "@invessiv/common/defaults/leads/outreach/lead-pitch-defaults";
import type { LeadsPitchDictionary } from "@/i18n/dictionaries/workspace/leads";
import styles from "./lead-pitch-paste-fallback.module.css";

const MIN_PASTE_LENGTH = 40;

type LeadPitchPasteFallbackProps = {
  channel: PitchChannel;
  content: LeadsPitchDictionary;
  handle: string | null;
  onCancelAction: () => void;
  onSubmitAction: (snapshot: ProfileSnapshot) => void;
};

export function LeadPitchPasteFallback({
  channel,
  content,
  handle,
  onCancelAction,
  onSubmitAction,
}: LeadPitchPasteFallbackProps) {
  const fieldId = useId();
  const [value, setValue] = useState("");
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);
  const isTooShort = value.trim().length < MIN_PASTE_LENGTH;

  function handleSubmit() {
    setHasTriedSubmit(true);

    if (isTooShort) {
      return;
    }

    onSubmitAction({
      platform: channel,
      source: ProfileSnapshotSource.ManualPaste,
      handle,
      displayName: null,
      biography: value.trim(),
      headline: null,
      category: null,
      followerCount: null,
      isVerified: false,
      posts: [],
      capturedAt: new Date().toISOString(),
    });
  }

  return (
    <div className={styles.wrapper}>
      <label className={styles.label} htmlFor={fieldId}>
        {content.paste.title}
      </label>
      <p className={styles.description}>{content.paste.description}</p>
      <textarea
        className={styles.textarea}
        id={fieldId}
        maxLength={PITCH_PASTE_MAX_LEN}
        onChange={(event) => setValue(event.currentTarget.value)}
        placeholder={content.paste.placeholder}
        rows={5}
        value={value}
      />
      {hasTriedSubmit && isTooShort ? (
        <p className={styles.error} role="alert">
          {content.paste.tooShort}
        </p>
      ) : null}
      <div className={styles.actions}>
        <button className={styles.submit} onClick={handleSubmit} type="button">
          {content.paste.submit}
        </button>
        <button
          className={styles.cancel}
          onClick={onCancelAction}
          type="button"
        >
          {content.paste.cancel}
        </button>
      </div>
    </div>
  );
}
