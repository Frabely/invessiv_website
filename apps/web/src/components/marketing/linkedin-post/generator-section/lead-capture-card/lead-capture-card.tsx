import { CONTACT_EMAIL_PATTERN } from "@invessiv/common/patterns/contact/contact-email";
import { type ChangeEvent, type FormEvent, useId, useState } from "react";
import { FormFieldKind } from "@invessiv/common/constants/form/form-field-kinds";
import { LeadCaptureFieldName } from "@/common/constants/generator/lead-capture-field-names";
import { LeadDeliverStatus } from "@/common/constants/generator/lead-deliver-status";
import type { LeadCaptureFieldErrors } from "@/common/contracts/generator/generator-field-errors";
import type { LeadIdentity } from "@/common/contracts/generator/lead-identity";
import { linkedinPostDeliverService } from "@/client/linkedin-post/services/linkedin-post-deliver-service";
import {
  ButtonControl,
  PrimaryCtaButton,
} from "@/components/shared/button/button";
import type { Locale } from "@/config/i18n";
import type { LinkedInPostGeneratorLeadCaptureCopy } from "@/i18n/dictionaries/linkedin-post/generator";
import { leadDeliverErrorMessage } from "@/client/linkedin-post/errors/lead-deliver-error";
import { FormField } from "@/components/shared/form/form-field/form-field";
import { LeadCaptureConsentField } from "./lead-capture-consent-field/lead-capture-consent-field";
import styles from "./lead-capture-card.module.css";

type LeadCaptureCardProps = {
  content: LinkedInPostGeneratorLeadCaptureCopy;
  deliveryToken?: string;
  locale: Locale;
  onIdentityChange: (identity: LeadIdentity) => void;
  onRequestNewPost: () => void;
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
  onRequestNewPost,
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

      <FormField
        controlClassName={styles.input}
        errorMessage={errors.displayName}
        errorMessageId={`${ids.displayName}-error`}
        hint={content.displayName.help}
        hintId={`${ids.displayName}-hint`}
        inputProps={{
          "aria-label": content.displayName.label,
          autoComplete: "name",
          id: ids.displayName,
          maxLength: displayNameMax,
          name: "leadName",
          onChange: (event: ChangeEvent<HTMLInputElement>) => {
            setDisplayName(event.target.value);
            clearError(LeadCaptureFieldName.DisplayName);
          },
          placeholder: content.displayName.placeholder,
          required: true,
          value: displayName,
        }}
        kind={FormFieldKind.Text}
        label={content.displayName.label}
        required
      />

      <FormField
        controlClassName={styles.input}
        errorMessage={errors.email}
        errorMessageId={`${ids.email}-error`}
        inputProps={{
          "aria-label": content.email.label,
          autoComplete: "email",
          id: ids.email,
          name: "leadEmail",
          onChange: (event: ChangeEvent<HTMLInputElement>) => {
            setEmail(event.target.value);
            clearError(LeadCaptureFieldName.Email);
          },
          placeholder: content.email.placeholder,
          required: true,
          value: email,
        }}
        kind={FormFieldKind.Email}
        label={content.email.label}
        required
      />

      <LeadCaptureConsentField
        checked={consentDelivery}
        error={errors.consentDelivery}
        id={ids.consentDelivery}
        label={content.consentDelivery.label}
        name="consentDelivery"
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          setConsentDelivery(event.target.checked);
          clearError(LeadCaptureFieldName.ConsentDelivery);
        }}
        required
      />

      <LeadCaptureConsentField
        checked={consentMarketing}
        id={ids.consentMarketing}
        label={content.consentMarketing.label}
        name="consentMarketing"
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          setConsentMarketing(event.target.checked)
        }
      >
        <span className={styles.microcopy}>{content.marketingMicrocopy}</span>
      </LeadCaptureConsentField>

      <div className={styles.actions}>
        <PrimaryCtaButton
          aria-busy={isSending}
          className={styles.emailAction}
          disabled={isSending}
          type="submit"
        >
          {isSending ? content.emailActionLoading : content.emailAction}
        </PrimaryCtaButton>
        <ButtonControl
          className={styles.secondaryAction}
          onClick={onRequestNewPost}
          type="button"
          variant="ghost"
        >
          {content.newPostAction}
        </ButtonControl>
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
