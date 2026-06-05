import { CONTACT_EMAIL_PATTERN } from "@invessiv/common/patterns/contact/contact-email";
import { type ChangeEvent, useId, useState } from "react";
import { LeadCaptureFieldName } from "@/common/constants/generator/lead-capture-field-names";
import type { LeadCaptureFieldErrors } from "@/common/contracts/generator/generator-field-errors";
import { PrimaryCtaButton } from "@/components/shared/button/button";
import type { LinkedInPostGeneratorLeadCaptureCopy } from "@/i18n/dictionaries/linkedin-post/generator";
import { Field } from "../field";
import { LeadCaptureFeedback } from "@/common/constants/generator/lead-capture-feedback";
import styles from "./lead-capture-card.module.css";

export type LeadIdentity = {
  displayName: string;
  email: string;
};

type LeadCaptureCardProps = {
  content: LinkedInPostGeneratorLeadCaptureCopy;
  /** Triggers the actual image + caption download (post bytes live client-side). */
  onDownload: () => void;
  /** Best-effort lift of the captured identity for contact-form prefill. */
  onIdentityChange: (identity: LeadIdentity) => void;
};

/**
 * Gated lead-capture step shown after a successful generation. Name + email are
 * exchanged for the download (works today) or the email delivery ("coming soon"
 * in Phase A). Two-consent model: a required transactional consent and an
 * optional, unchecked marketing opt-in with trust microcopy.
 */
export function LeadCaptureCard({
  content,
  onDownload,
  onIdentityChange,
}: LeadCaptureCardProps) {
  const baseId = useId();
  const ids = {
    displayName: `${baseId}-lead-name`,
    email: `${baseId}-lead-email`,
    consentDelivery: `${baseId}-lead-consent-delivery`,
    consentMarketing: `${baseId}-lead-consent-marketing`,
  };

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [consentDelivery, setConsentDelivery] = useState(false);
  const [consentMarketing, setConsentMarketing] = useState(false);
  const [errors, setErrors] = useState<LeadCaptureFieldErrors>({});
  const [feedback, setFeedback] = useState<LeadCaptureFeedback | null>(null);

  const displayNameMax = content.displayName.maxLength ?? 80;

  function clearError(field: keyof LeadCaptureFieldErrors) {
    setErrors((current) => {
      if (!(field in current)) {
        return current;
      }
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function validate(): LeadCaptureFieldErrors {
    const next: LeadCaptureFieldErrors = {};
    const trimmedName = displayName.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      next.displayName = content.displayName.requiredError;
    } else if (
      content.displayName.maxLength &&
      trimmedName.length > content.displayName.maxLength &&
      content.displayName.tooLongError
    ) {
      next.displayName = content.displayName.tooLongError;
    }

    if (!trimmedEmail) {
      next.email = content.email.requiredError;
    } else if (
      !CONTACT_EMAIL_PATTERN.test(trimmedEmail) &&
      content.email.invalidError
    ) {
      next.email = content.email.invalidError;
    }

    if (!consentDelivery) {
      next.consentDelivery = content.consentDelivery.requiredError;
    }

    return next;
  }

  function runGatedAction(action: LeadCaptureFeedback) {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setFeedback(null);
      return;
    }

    setErrors({});
    onIdentityChange({ displayName: displayName.trim(), email: email.trim() });

    if (action === LeadCaptureFeedback.Download) {
      onDownload();
    }
    setFeedback(action);
  }

  const feedbackMessage =
    feedback === LeadCaptureFeedback.Download
      ? content.success.download
      : feedback === LeadCaptureFeedback.Email
        ? content.emailComingSoon
        : null;

  return (
    <div className={styles.card}>
      <header className={styles.head}>
        <h3 className={styles.headline}>{content.headline}</h3>
        <p className={styles.body}>{content.body}</p>
      </header>

      <Field
        error={errors.displayName}
        help={content.displayName.help}
        htmlFor={ids.displayName}
        label={content.displayName.label}
      >
        <input
          aria-describedby={
            errors.displayName ? `${ids.displayName}-error` : undefined
          }
          aria-invalid={Boolean(errors.displayName)}
          autoComplete="name"
          className={styles.input}
          id={ids.displayName}
          maxLength={displayNameMax}
          name="leadName"
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setDisplayName(event.target.value);
            clearError(LeadCaptureFieldName.DisplayName);
          }}
          placeholder={content.displayName.placeholder}
          type="text"
          value={displayName}
        />
      </Field>

      <Field
        error={errors.email}
        htmlFor={ids.email}
        label={content.email.label}
      >
        <input
          aria-describedby={errors.email ? `${ids.email}-error` : undefined}
          aria-invalid={Boolean(errors.email)}
          autoComplete="email"
          className={styles.input}
          id={ids.email}
          name="leadEmail"
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setEmail(event.target.value);
            clearError(LeadCaptureFieldName.Email);
          }}
          placeholder={content.email.placeholder}
          type="email"
          value={email}
        />
      </Field>

      <label
        className={styles.consent}
        data-error={Boolean(errors.consentDelivery) || undefined}
        htmlFor={ids.consentDelivery}
      >
        <input
          aria-describedby={
            errors.consentDelivery ? `${ids.consentDelivery}-error` : undefined
          }
          aria-invalid={Boolean(errors.consentDelivery)}
          checked={consentDelivery}
          className={styles.consentInput}
          id={ids.consentDelivery}
          name="consentDelivery"
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            setConsentDelivery(event.target.checked);
            clearError(LeadCaptureFieldName.ConsentDelivery);
          }}
          type="checkbox"
        />
        <span aria-hidden="true" className={styles.consentBox} />
        <span className={styles.consentText}>
          {content.consentDelivery.label}
        </span>
      </label>
      {errors.consentDelivery ? (
        <p className={styles.consentError} id={`${ids.consentDelivery}-error`}>
          {errors.consentDelivery}
        </p>
      ) : null}

      <label className={styles.consent} htmlFor={ids.consentMarketing}>
        <input
          checked={consentMarketing}
          className={styles.consentInput}
          id={ids.consentMarketing}
          name="consentMarketing"
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setConsentMarketing(event.target.checked)
          }
          type="checkbox"
        />
        <span aria-hidden="true" className={styles.consentBox} />
        <span className={styles.consentText}>
          {content.consentMarketing.label}
          <span className={styles.microcopy}>{content.marketingMicrocopy}</span>
        </span>
      </label>

      <div className={styles.actions}>
        <PrimaryCtaButton
          className={styles.downloadAction}
          onClick={() => runGatedAction(LeadCaptureFeedback.Download)}
          type="button"
        >
          {content.downloadAction}
        </PrimaryCtaButton>
        <button
          className={styles.emailAction}
          onClick={() => runGatedAction(LeadCaptureFeedback.Email)}
          type="button"
        >
          <span>{content.emailAction}</span>
          <span className={styles.comingSoon}>{content.comingSoonBadge}</span>
        </button>
      </div>

      {feedbackMessage ? (
        <p
          className={styles.feedback}
          data-kind={feedback ?? undefined}
          role="status"
        >
          {feedbackMessage}
        </p>
      ) : null}
    </div>
  );
}
