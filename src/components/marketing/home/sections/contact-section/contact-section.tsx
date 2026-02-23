import type { LandingSectionCopy } from "@/content/landing/home";

type ContactCta = NonNullable<LandingSectionCopy["contactCta"]>;

type ContactSectionProps = {
  contactCta?: ContactCta;
  contactSecondaryCta?: ContactCta;
  description: string;
  id: string;
  title: string;
};

export function ContactSection({
  contactCta,
  contactSecondaryCta,
  description,
  id,
  title,
}: ContactSectionProps) {
  return (
    <section className="contact-section" id={id}>
      <div className="contact-cta-banner">
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
    </section>
  );
}
