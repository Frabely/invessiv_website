import type { LandingSectionCopy } from "@/i18n/dictionaries/marketing/home";
import { ProjectRequestForm } from "@/components/marketing/home/sections/contact-section/project-request-form/project-request-form";
import { SectionScanPoints } from "@/components/marketing/home/shared/section-scan-points/section-scan-points";
import { COMPANY_MAILTO } from "@/config/company";

type ContactCta = NonNullable<LandingSectionCopy["contactCta"]>;
type ContactChannel = NonNullable<
  LandingSectionCopy["contactChannels"]
>[number];
type ContactForm = NonNullable<LandingSectionCopy["contactForm"]>;

type ContactSectionProps = {
  contactCta?: ContactCta;
  contactChannels: ContactChannel[];
  contactChecklist: string[];
  contactChecklistHint?: string;
  contactChecklistTitle?: string;
  contactDecisionIntro?: string;
  contactForm?: ContactForm;
  contactFormOffers: Array<{ key: string; title: string }>;
  contactSecondaryCta?: ContactCta;
  description: string;
  id: string;
  privacyHref: string;
  summaryPoints?: string[];
  title: string;
};

export function ContactSection({
  contactCta,
  contactChannels,
  contactChecklist,
  contactChecklistHint,
  contactChecklistTitle,
  contactDecisionIntro,
  contactForm,
  contactFormOffers,
  contactSecondaryCta,
  description,
  id,
  privacyHref,
  summaryPoints,
  title,
}: ContactSectionProps) {
  const primaryPath = contactCta && contactForm
    ? { cta: contactCta, form: contactForm }
    : null;
  const decisionOptions = [
    primaryPath
      ? {
          id: "primary",
          label: primaryPath.form.title,
          kicker: primaryPath.cta.kicker,
          description: primaryPath.cta.description ?? primaryPath.form.subtitle,
        }
      : null,
    ...contactChannels.map((channel) => ({
      id: channel.label,
      label: channel.label,
      kicker: channel.kicker,
      description: channel.description ?? channel.hint ?? "",
    })),
  ].filter(
    (option): option is {
      id: string;
      label: string;
      kicker?: string;
      description: string;
    } => option !== null,
  );

  return (
    <section className="contact-section" id={id}>
      <div className="contact-layout">
        <div className="contact-brief-card">
          <h2>{title}</h2>
          <p className="contact-decision-intro">
            {contactDecisionIntro ?? description}
          </p>
          <SectionScanPoints
            fallbackClassName="contact-hint"
            fallbackText={description}
            points={summaryPoints}
          />

          <div className="contact-path-grid" role="list">
            {primaryPath ? (
              <article
                className="contact-path-card contact-path-card--primary"
                role="listitem"
              >
                {primaryPath.cta.kicker ? (
                  <p className="contact-path-label">{primaryPath.cta.kicker}</p>
                ) : null}
                <h3>{primaryPath.form.title}</h3>
                <p className="contact-path-description">{primaryPath.form.subtitle}</p>
                {primaryPath.cta.description ? (
                  <p className="contact-path-hint">{primaryPath.cta.description}</p>
                ) : null}

                <ProjectRequestForm
                  formCopy={primaryPath.form}
                  offerOptions={contactFormOffers}
                  openButtonLabel={primaryPath.cta.label}
                  privacyHref={privacyHref}
                  privacyLabel={primaryPath.form.privacyLabel}
                  submitHref={COMPANY_MAILTO}
                />
              </article>
            ) : null}

            {contactChannels.map((channel) => (
              <article
                className="contact-path-card"
                key={channel.label}
                role="listitem"
              >
                {channel.kicker ? (
                  <p className="contact-path-label">{channel.kicker}</p>
                ) : null}
                <h3>{channel.label}</h3>
                {channel.description ? (
                  <p className="contact-path-description">{channel.description}</p>
                ) : null}
                <p className="contact-path-value">{channel.value}</p>
                {channel.hint ? (
                  <p className="contact-path-hint">{channel.hint}</p>
                ) : null}
                <a
                  className="contact-channel-action-link contact-channel-action-link--secondary"
                  href={channel.href}
                >
                  {channel.actionLabel ?? "Kontakt aufnehmen"}
                </a>
              </article>
            ))}
          </div>

          <div className="contact-cta-wrap">
            {contactCta?.hint ? <p>{contactCta.hint}</p> : null}
            {contactSecondaryCta ? (
              <a className="btn btn--ghost" href={contactSecondaryCta.href}>
                {contactSecondaryCta.label}
              </a>
            ) : null}
          </div>
        </div>

        {contactChecklist.length ? (
          <aside className="contact-checklist-card" aria-label="Kontakt Ablauf">
            {contactChecklistTitle ? <h3>{contactChecklistTitle}</h3> : null}
            {contactChecklistHint ? (
              <p className="contact-checklist-hint">{contactChecklistHint}</p>
            ) : null}
            {decisionOptions.length ? (
              <ul className="contact-decision-list">
                {decisionOptions.map((option) => (
                  <li className="contact-decision-item" key={option.id}>
                    <p className="contact-decision-heading">
                      <strong>{option.label}</strong>
                      {option.kicker ? <small>{option.kicker}</small> : null}
                    </p>
                    {option.description ? (
                      <p className="contact-decision-copy">{option.description}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
            <ul className="contact-checklist">
              {contactChecklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </aside>
        ) : null}
      </div>
    </section>
  );
}
