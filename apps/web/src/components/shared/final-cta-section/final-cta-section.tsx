"use client";

import { useRef } from "react";
import { ContactForm } from "@/components/marketing/home/sections/contact-section/contact-form/contact-form";
import { LanguageProvider } from "@/components/providers/language-provider";
import { EyebrowPill } from "@/components/shared/eyebrow-pill/eyebrow-pill";
import { COMPANY_CALENDLY } from "@/config/company";
import type { Locale } from "@/config/i18n";
import { useStaggeredSectionReveal } from "@/hooks/marketing/use-staggered-section-reveal";
import type { ContactFormCopy } from "@/i18n/dictionaries/marketing/home";
import type { FinalCtaContent } from "@/i18n/dictionaries/shared/final-cta";
import { ContactSubmissionOrigin } from "@invessiv/common/constants/contact/contact-submission-origin";
import {
  CONTACT_PROJECT_SCOPE,
  type ContactProjectScope,
} from "@invessiv/common/constants/contact/contact-project-scopes";
import styles from "./final-cta-section.module.css";

type FinalCtaSectionProps = FinalCtaContent & {
  analyticsLocation: string;
  id: string;
  locale: Locale;
  origin: ContactSubmissionOrigin;
  projectScope?: ContactProjectScope;
  projectScopeLabel?: string;
};

function toContactFormCopy(content: FinalCtaContent): ContactFormCopy {
  return {
    callSubmitLabel: content.form.submitLabel,
    callSubmitSuccess: content.form.callSubmitSuccess,
    callSubmittingLabel: content.form.submittingLabel,
    emailNote: content.form.emailNote,
    honeypotLabel: content.form.fields.honeypot.label,
    emailQuestion: content.form.emailQuestion,
    emailSubmitErrorDelivery: content.form.errorDelivery,
    emailSubmitLabel: content.form.emailSubmitLabel,
    emailSubmitSuccess: content.form.emailSubmitSuccess,
    emailSubmittingLabel: content.form.emailSubmittingLabel,
    consentLabel: content.form.consentLabel,
    emailLabel: content.form.fields.email.label,
    fieldErrorConsentRequired: content.form.errorConsent,
    fieldErrorInvalidEmail: content.form.errorEmail,
    fieldErrorRequired: content.form.errorRequired,
    messageLabel: content.form.fields.goal.label,
    messagePlaceholder: content.form.fields.goal.placeholder ?? "",
    nameLabel: content.form.fields.name.label,
    privacyLabel: content.form.privacyLabel,
    privacySuffix: content.form.privacySuffix,
    projectScopeLabel: "",
    projectScopeOptions: {
      [CONTACT_PROJECT_SCOPE.BusinessWebsite]: "",
      [CONTACT_PROJECT_SCOPE.CompactWebsite]: "",
      [CONTACT_PROJECT_SCOPE.LandingPage]: "",
    },
    requiredHint: content.form.requiredHint,
    submitErrorGeneric: content.form.errorGeneric,
    submitErrorRateLimited: content.form.errorRateLimited,
  };
}

export function FinalCtaSection({
  analyticsLocation,
  body,
  eyebrow,
  form,
  id,
  locale,
  origin,
  portrait,
  projectScope,
  projectScopeLabel,
  title,
  trustLine,
}: FinalCtaSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  useStaggeredSectionReveal(sectionRef, locale);
  const formCopy = toContactFormCopy({
    body,
    eyebrow,
    form,
    portrait,
    title,
    trustLine,
  });

  return (
    <section
      aria-labelledby={`${id}-title`}
      className={styles.section}
      id={id}
      ref={sectionRef}
    >
      <span aria-hidden="true" className={styles.spotlight} />
      <div className={styles.intro} data-reveal-item="true">
        <EyebrowPill className={styles.eyebrow}>{eyebrow}</EyebrowPill>
        <h2 className={styles.title} id={`${id}-title`}>
          {title}
        </h2>
        <p className={styles.body}>{body}</p>
      </div>
      <div className={styles.stage} data-reveal-item="true">
        <LanguageProvider initialLocale={locale}>
          <ContactForm
            analyticsLocation={analyticsLocation}
            calendlyHref={COMPANY_CALENDLY}
            formCopy={formCopy}
            origin={origin}
            portrait={portrait}
            privacyHref={form.privacyHref}
            projectScope={projectScope}
            projectScopeLabel={projectScopeLabel}
            showProjectScope={false}
          />
        </LanguageProvider>
      </div>
      <p className={styles.trustLine} data-reveal-item="true">
        {trustLine}
      </p>
    </section>
  );
}
