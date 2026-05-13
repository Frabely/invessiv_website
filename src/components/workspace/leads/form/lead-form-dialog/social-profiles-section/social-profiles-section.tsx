"use client";

import { useEffect, useRef, useState } from "react";
import {
  type Control,
  useFieldArray,
  type UseFormClearErrors,
} from "react-hook-form";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  LEAD_SOCIAL_PLATFORMS_VALUES,
  type LeadSocialPlatform,
} from "@/common/constants/leads/social/lead-social-platforms";
import {
  ButtonControl,
  PrimaryCtaButton,
} from "@/components/shared/button/button";
import { FormField } from "@/components/shared/form/form-field/form-field";
import type { LeadFormValues } from "@/common/contracts/leads/forms/lead-form-values";
import type {
  LeadsFormDictionary,
  LeadsSharedDictionary,
} from "@/i18n/dictionaries/workspace/leads";
import styles from "./social-profiles-section.module.css";

type SocialProfilesSectionProps = {
  clearErrorsAction: UseFormClearErrors<LeadFormValues>;
  content: LeadsFormDictionary;
  control: Control<LeadFormValues>;
  initialItemCount: number;
  isEditMode: boolean;
  onInteractionAction: () => void;
  sharedContent: LeadsSharedDictionary;
};

const SocialProfilesSectionField = {
  SocialProfiles: "social_profiles",
} as const;

export function SocialProfilesSection({
  clearErrorsAction,
  content,
  control,
  initialItemCount,
  isEditMode,
  onInteractionAction,
  sharedContent,
}: SocialProfilesSectionProps) {
  const socialProfiles = useFieldArray({
    control,
    name: SocialProfilesSectionField.SocialProfiles,
  });
  const editorRef = useRef<HTMLDivElement>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [platformDraft, setPlatformDraft] = useState<LeadSocialPlatform | "">(
    "",
  );
  const [profileUrlDraft, setProfileUrlDraft] = useState("");
  const [platformDraftError, setPlatformDraftError] = useState<string | null>(
    null,
  );
  const [profileUrlDraftError, setProfileUrlDraftError] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!editorOpen) {
      return;
    }

    const animationFrameId = window.requestAnimationFrame(() => {
      editorRef.current
        ?.querySelector<HTMLSelectElement>("[name='social_platform_draft']")
        ?.focus();
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [editorOpen]);

  function resetEditor() {
    setEditorOpen(false);
    setEditingIndex(null);
    setPlatformDraft("");
    setProfileUrlDraft("");
    setPlatformDraftError(null);
    setProfileUrlDraftError(null);
  }

  function openEditor() {
    if (editorOpen && editingIndex === null) {
      resetEditor();
      onInteractionAction();
      return;
    }

    setEditorOpen(true);
    setEditingIndex(null);
    setPlatformDraft("");
    setProfileUrlDraft("");
    setPlatformDraftError(null);
    setProfileUrlDraftError(null);
    onInteractionAction();
  }

  function beginEdit(index: number) {
    const profile = socialProfiles.fields[index];
    setEditorOpen(true);
    setEditingIndex(index);
    setPlatformDraft((profile?.platform as LeadSocialPlatform | "") ?? "");
    setProfileUrlDraft(profile?.profile_url ?? "");
    setPlatformDraftError(null);
    setProfileUrlDraftError(null);
    onInteractionAction();
  }

  function isValidUrl(value: string): boolean {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }

  function getProfileUrlDraftError(value: string): string | null {
    const trimmedProfileUrl = value.trim();

    if (!trimmedProfileUrl) {
      return content.validation.socialProfileRequired;
    }

    if (!isValidUrl(trimmedProfileUrl)) {
      return content.validation.urlInvalid;
    }

    return null;
  }

  function validateProfileUrlDraft() {
    setProfileUrlDraftError(getProfileUrlDraftError(profileUrlDraft));
  }

  function confirmDraft() {
    const selectedPlatform = platformDraft;
    const profileUrl = profileUrlDraft.trim();
    let hasError = false;

    if (!selectedPlatform) {
      setPlatformDraftError(content.validation.socialProfileRequired);
      hasError = true;
    } else if (
      socialProfiles.fields.some(
        (profile, index) =>
          profile.platform === selectedPlatform && index !== editingIndex,
      )
    ) {
      setPlatformDraftError(content.validation.socialProfileDuplicate);
      hasError = true;
    } else {
      setPlatformDraftError(null);
    }

    const profileUrlError = getProfileUrlDraftError(profileUrl);
    if (profileUrlError) {
      setProfileUrlDraftError(profileUrlError);
      hasError = true;
    } else {
      setProfileUrlDraftError(null);
    }

    if (hasError || !selectedPlatform) {
      return;
    }

    const nextProfile = {
      platform: selectedPlatform,
      profile_url: profileUrl,
    };

    if (editingIndex === null) {
      socialProfiles.append(nextProfile);
    } else {
      socialProfiles.update(editingIndex, nextProfile);
    }
    clearErrorsAction(SocialProfilesSectionField.SocialProfiles);
    resetEditor();
    onInteractionAction();
  }

  function removeSocialProfile(index: number) {
    socialProfiles.remove(index);
    if (editingIndex === index) {
      resetEditor();
    } else if (editingIndex !== null && editingIndex > index) {
      setEditingIndex((current) => (current === null ? null : current - 1));
    }
    clearErrorsAction(SocialProfilesSectionField.SocialProfiles);
    onInteractionAction();
  }

  const confirmButtonLabel =
    editingIndex === null
      ? content.buttons.confirmAdd
      : content.buttons.confirmEdit;

  const allSocialProfilesAdded =
    socialProfiles.fields.length >= LEAD_SOCIAL_PLATFORMS_VALUES.length;

  return (
    <section
      className={styles.section}
      aria-labelledby="add-lead-social-profiles"
    >
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle} id="add-lead-social-profiles">
          {content.sections.socialProfiles}
        </h3>
        <button
          aria-label={content.buttons.addProfile}
          aria-pressed={editorOpen}
          className={styles.iconToggleButton}
          disabled={allSocialProfilesAdded}
          onClick={openEditor}
          title={content.buttons.addProfile}
          type="button"
        >
          <FontAwesomeIcon icon={faPlus} />
        </button>
      </div>

      {editorOpen ? (
        <div className={styles.inlineDialog} ref={editorRef}>
          <div className={styles.socialEditorRow}>
            <FormField
              className={styles.field}
              controlClassName={styles.input}
              errorMessage={platformDraftError ?? undefined}
              kind="select"
              label={content.fields.platform}
              options={[
                {
                  label: content.placeholders.platform,
                  value: "",
                },
                ...LEAD_SOCIAL_PLATFORMS_VALUES.map((platform) => ({
                  label: sharedContent.platform[platform],
                  value: platform,
                })),
              ]}
              selectProps={{
                name: "social_platform_draft",
                onChange: (event) => {
                  setPlatformDraft(
                    event.currentTarget.value as LeadSocialPlatform | "",
                  );
                  setPlatformDraftError(null);
                  onInteractionAction();
                },
                value: platformDraft,
              }}
            />

            <FormField
              className={styles.field}
              controlClassName={styles.input}
              errorMessage={profileUrlDraftError ?? undefined}
              inputProps={{
                onChange: (event) => {
                  setProfileUrlDraft(event.currentTarget.value);
                  setProfileUrlDraftError(null);
                  onInteractionAction();
                },
                onBlur: validateProfileUrlDraft,
                placeholder: content.placeholders.profileUrl,
                value: profileUrlDraft,
              }}
              kind="url"
              label={content.fields.profileUrl}
            />
            <ButtonControl onClick={resetEditor} type="button" variant="ghost">
              {content.buttons.cancel}
            </ButtonControl>
            <PrimaryCtaButton onClick={confirmDraft} type="button">
              {confirmButtonLabel}
            </PrimaryCtaButton>
          </div>
        </div>
      ) : null}

      {socialProfiles.fields.length === 0 ? (
        <p className={styles.emptyState}>
          {isEditMode && initialItemCount > 0
            ? content.help.socialProfilesClearedState
            : content.help.socialProfilesEmptyState}
        </p>
      ) : (
        <div className={styles.stack}>
          {socialProfiles.fields.map((field, index) => (
            <div className={styles.socialRow} key={field.id}>
              <span className={styles.listItemText}>
                {sharedContent.platform[field.platform as LeadSocialPlatform]}
              </span>
              <span className={styles.listItemMeta}>{field.profile_url}</span>

              <div className={styles.rowActions}>
                <ButtonControl
                  onClick={() => beginEdit(index)}
                  type="button"
                  variant="ghost"
                >
                  {content.buttons.edit}
                </ButtonControl>
                <ButtonControl
                  onClick={() => removeSocialProfile(index)}
                  type="button"
                  variant="ghost"
                >
                  {content.buttons.remove}
                </ButtonControl>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
