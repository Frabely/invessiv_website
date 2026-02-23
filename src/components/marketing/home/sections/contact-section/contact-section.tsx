"use client";

import { useState } from "react";

import type { LandingSectionCopy } from "@/content/landing/home";

type ContactChannel = NonNullable<LandingSectionCopy["contactChannels"]>[number];
type ContactCta = NonNullable<LandingSectionCopy["contactCta"]>;

type ContactSectionProps = {
  checklist: string[];
  checklistHint?: string;
  checklistTitle: string;
  contactCta?: ContactCta;
  description: string;
  id: string;
  title: string;
  channels: ContactChannel[];
};

export function ContactSection({
  checklist,
  checklistHint,
  checklistTitle,
  contactCta,
  description,
  id,
  title,
  channels,
}: ContactSectionProps) {
  const [copiedChannelLabel, setCopiedChannelLabel] = useState<string | null>(null);

  const handleCopy = async (channelLabel: string, value: string) => {
    if (!navigator?.clipboard?.writeText) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      setCopiedChannelLabel(channelLabel);
      window.setTimeout(() => {
        setCopiedChannelLabel((current) =>
          current === channelLabel ? null : current,
        );
      }, 1400);
    } catch {
      // Clipboard can be blocked by browser permissions; keep UI usable.
    }
  };

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
              {channel.actionLabel || channel.copyValue ? (
                <div className="contact-channel-actions">
                  {channel.actionLabel ? (
                    <a className="contact-channel-action-link" href={channel.href}>
                      {channel.actionLabel}
                    </a>
                  ) : null}
                  {channel.copyValue && channel.copyLabel ? (
                    <button
                      className="contact-copy-btn"
                      onClick={() => handleCopy(channel.label, channel.copyValue as string)}
                      type="button"
                    >
                      {copiedChannelLabel === channel.label && channel.copiedLabel
                        ? channel.copiedLabel
                        : channel.copyLabel}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </article>
          ))}
        </div>

        <aside className="contact-brief-card">
          <h3>{checklistTitle}</h3>
          {checklistHint ? <p className="contact-checklist-hint">{checklistHint}</p> : null}
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
