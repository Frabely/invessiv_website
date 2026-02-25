import type { LandingSectionCopy } from "@/content/landing/home";

type ContactCta = NonNullable<LandingSectionCopy["contactCta"]>;
type ContactChannel = NonNullable<
  LandingSectionCopy["contactChannels"]
>[number];

type ContactSectionProps = {
  contactCta?: ContactCta;
  contactChannels: ContactChannel[];
  contactChecklist: string[];
  contactChecklistHint?: string;
  contactChecklistTitle?: string;
  contactSecondaryCta?: ContactCta;
  description: string;
  id: string;
  title: string;
};

export function ContactSection({
  contactCta,
  contactChannels,
  contactChecklist,
  contactChecklistHint,
  contactChecklistTitle,
  contactSecondaryCta,
  description,
  id,
  title,
}: ContactSectionProps) {
  return (
    <section className="contact-section" id={id}>
      <div className="contact-layout">
        <div className="contact-brief-card">
          <h2>{title}</h2>
          <p className="contact-hint">{description}</p>
          <div className="contact-cta-actions">
            {contactCta ? (
              <a className="btn btn--primary" href={contactCta.href}>
                {contactCta.label}
              </a>
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
