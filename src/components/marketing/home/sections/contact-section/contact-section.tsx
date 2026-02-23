import type { LandingSectionCopy } from "@/content/landing/home";

type ContactChannel = NonNullable<LandingSectionCopy["contactChannels"]>[number];
type ContactCta = NonNullable<LandingSectionCopy["contactCta"]>;

type ContactSectionProps = {
  checklist: string[];
  checklistTitle: string;
  contactCta?: ContactCta;
  description: string;
  id: string;
  title: string;
  channels: ContactChannel[];
};

export function ContactSection({
  checklist,
  checklistTitle,
  contactCta,
  description,
  id,
  title,
  channels,
}: ContactSectionProps) {
  return (
    <section className="contact-section" id={id}>
      <h2>{title}</h2>
      <p className="contact-hint">{description}</p>

      <div className="contact-layout">
        <div className="contact-channel-list" role="list">
          {channels.map((channel) => (
            <article className="contact-channel-card" key={channel.label} role="listitem">
              <p className="contact-channel-label">{channel.label}</p>
              <a className="contact-channel-link" href={channel.href}>
                {channel.value}
              </a>
              {channel.hint ? <p className="contact-channel-hint">{channel.hint}</p> : null}
            </article>
          ))}
        </div>

        <aside className="contact-brief-card">
          <h3>{checklistTitle}</h3>
          <ul className="contact-checklist">
            {checklist.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>

          {contactCta ? (
            <div className="contact-cta-wrap">
              <a className="btn btn--primary" href={contactCta.href}>
                {contactCta.label}
              </a>
              <p>{contactCta.hint}</p>
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
