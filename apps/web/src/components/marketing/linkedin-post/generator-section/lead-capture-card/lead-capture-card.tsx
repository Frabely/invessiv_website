import { CONTACT_EMAIL_PATTERN } from "@invessiv/common/patterns/contact/contact-email";
import { type ChangeEvent, type FormEvent, useId, useState } from "react";
import { LeadCaptureFieldName } from "@/common/constants/generator/lead-capture-field-names";
import { LeadDeliverStatus } from "@/common/constants/generator/lead-deliver-status";
import type { LeadCaptureFieldErrors } from "@/common/contracts/generator/generator-field-errors";
import type { LeadIdentity } from "@/common/contracts/generator/lead-identity";
import { linkedinPostDeliverService } from "@/client/linkedin-post/services/linkedin-post-deliver-service";
import { PrimaryCtaButton } from "@/components/shared/button/button";
import type { Locale } from "@/config/i18n";
import type { LinkedInPostGeneratorLeadCaptureCopy } from "@/i18n/dictionaries/linkedin-post/generator";
import { leadDeliverErrorMessage } from "@/client/linkedin-post/errors/lead-deliver-error";
import { Field } from "../field";
import styles from "./lead-capture-card.module.css";

type LeadCaptureCardProps = {
  content: LinkedInPostGeneratorLeadCaptureCopy;
  deliveryToken?: string;
  locale: Locale;
  onIdentityChange: (identity: LeadIdentity) => void;
  deliver?: typeof linkedinPostDeliverService.deliverLinkedInPost;
};

/**
 * Gated lead-capture step shown after a successful generation. Name + email are
 * exchanged for the email delivery of the post (with caption). Two-consent
 * model: a required transactional consent and an optional, unchecked marketing
 * opt-in with trust microcopy. The delivery itself runs server-side via a
 * signed token; clipboard copy of the caption stays free elsewhere.
 */
export function LeadCaptureCard({
  content,
  deliveryToken,
  locale,
  onIdentityChange,
  deliver = linkedinPostDeliverService.deliverLinkedInPost,
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
  const [status, setStatus] = useState<LeadDeliverStatus>(
    LeadDeliverStatus.Idle,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const displayNameMax = content.displayName.maxLength ?? 80;
  const isSending = status === LeadDeliverStatus.Sending;

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSending) {
      return;
    }

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setStatus(LeadDeliverStatus.Idle);
      setErrorMessage(null);
      return;
    }

    setErrors({});
    const trimmedName = displayName.trim();
    const trimmedEmail = email.trim();
    onIdentityChange({ displayName: trimmedName, email: trimmedEmail });

    if (!deliveryToken) {
      setStatus(LeadDeliverStatus.Error);
      setErrorMessage(content.deliver.errorGeneric);
      return;
    }

    setStatus(LeadDeliverStatus.Sending);
    setErrorMessage(null);

    try {
      const result = await deliver(
        {
          consentDelivery,
          consentMarketing,
          deliveryToken,
          displayName: trimmedName,
          email: trimmedEmail,
        },
        locale,
      );

      if (result.ok) {
        setStatus(LeadDeliverStatus.Success);
        return;
      }

      setStatus(LeadDeliverStatus.Error);
      setErrorMessage(leadDeliverErrorMessage(result.code, content.deliver));
    } catch {
      setStatus(LeadDeliverStatus.Error);
      setErrorMessage(content.deliver.errorGeneric);
    }
  }

  return (
    <form className={styles.card} noValidate onSubmit={handleSubmit}>
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
          aria-busy={isSending}
          className={styles.emailAction}
          disabled={isSending}
          type="submit"
        >
          {isSending ? content.emailActionLoading : content.emailAction}
        </PrimaryCtaButton>
      </div>

      {status === LeadDeliverStatus.Success ? (
        <p className={styles.feedback} data-kind="success" role="status">
          {content.deliver.success}
        </p>
      ) : null}
      {status === LeadDeliverStatus.Error && errorMessage ? (
        <p className={styles.feedback} data-kind="error" role="alert">
          {errorMessage}
        </p>
      ) : null}
    </form>
  );
}
