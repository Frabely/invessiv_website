import type { LandingSectionCopy } from "@/i18n/dictionaries/marketing/home";
import { ProjectRequestForm } from "@/components/marketing/home/sections/contact-section/project-request-form/project-request-form";
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
  contactForm?: ContactForm;
  contactFormOffers: Array<{ key: string; title: string }>;
  contactSecondaryCta?: ContactCta;
  description: string;
  id: string;
  privacyHref: string;
  title: string;
};

export function ContactSection({
  contactCta,
  contactChannels,
  contactChecklist,
  contactChecklistHint,
  contactChecklistTitle,
  contactForm,
  contactFormOffers,
  contactSecondaryCta,
  description,
  id,
  privacyHref,
  title,
}: ContactSectionProps) {
  return (
    <section className="contact-section" id={id}>
      <div className="contact-layout">
        <div className="contact-brief-card">
          <h2>{title}</h2>
          <p className="contact-hint">{description}</p>
          <div className="contact-cta-actions">
            {contactCta && contactForm ? (
              <ProjectRequestForm
                formCopy={contactForm}
                offerOptions={contactFormOffers}
                openButtonLabel={contactCta.label}
                privacyHref={privacyHref}
                privacyLabel={contactForm.privacyLabel}
                submitHref={COMPANY_MAILTO}
              />
            ) : null}
            {contactSecondaryCta ? (
              <a className="btn btn--ghost" href={contactSecondaryCta.href}>
                {contactSecondaryCta.label}
              </a>
            ) : null}
          </div>
        </div>

        {contactChecklist.length ? (
          <aside
            className="contact-checklist-card"
            aria-label="Kontakt Checkliste"
          >
            {contactChecklistTitle ? <h3>{contactChecklistTitle}</h3> : null}
            <ul className="contact-checklist">
              {contactChecklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            {contactChecklistHint ? (
              <p className="contact-checklist-hint">{contactChecklistHint}</p>
            ) : null}
          </aside>
        ) : null}
      </div>

      {contactChannels.length ? (
        <div className="contact-channel-grid" role="list">
          {contactChannels.map((channel) => (
            <article
              className="contact-channel-card"
              key={channel.label}
              role="listitem"
            >
              <p className="contact-channel-label">{channel.label}</p>
              <p className="contact-channel-value">{channel.value}</p>
              {channel.hint ? (
                <p className="contact-channel-hint">{channel.hint}</p>
              ) : null}
              <a className="contact-channel-action-link" href={channel.href}>
                {channel.actionLabel ?? "Kontakt aufnehmen"}
              </a>
            </article>
          ))}
        </div>
      ) : null}

      <div className="contact-cta-wrap">
        {contactCta?.hint ? <p>{contactCta.hint}</p> : null}
      </div>
    </section>
  );
}
