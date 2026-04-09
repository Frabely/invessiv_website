"use client";

import { ContactHelperList } from "@/components/marketing/home/sections/contact-section/components/contact-helper-list";
import { ContactFormShell } from "@/components/marketing/home/sections/contact-section/components/contact-form-shell";
import { PrimaryCtaLink } from "@/components/shared/button/button";
import { getContactTarget } from "@/lib/analytics/get-contact-target";
import type { LandingSectionCopy } from "@/i18n/dictionaries/marketing/home";
import styles from "./discovery-call-panel.module.css";

type ContactChannel = NonNullable<
  LandingSectionCopy["contactChannels"]
>[number];

type DiscoveryCallPanelProps = {
  channel: ContactChannel;
};

export function DiscoveryCallPanel({ channel }: DiscoveryCallPanelProps) {
  const isExternalLink = /^https?:\/\//i.test(channel.href);

  return (
    <ContactFormShell intro={channel.description ?? ""} title={channel.label}>
      {channel.helper ? (
        <p className={styles.helper}>{channel.helper}</p>
      ) : null}

      {channel.detailPoints?.length ? (
        <ContactHelperList items={channel.detailPoints} />
      ) : null}

      <div className={styles.footer}>
        {channel.hint ? <p className={styles.hint}>{channel.hint}</p> : null}
        <div className={styles.actions}>
          <PrimaryCtaLink
            className={styles.primaryCta}
            href={channel.href}
            rel={isExternalLink ? "noopener noreferrer" : undefined}
            target={isExternalLink ? "_blank" : undefined}
            data-analytics-event="contact_click"
            data-analytics-location="contact"
            data-analytics-target={getContactTarget(channel.href) ?? "call"}
          >
            {channel.actionLabel ?? "Kennenlern-Call starten"}
          </PrimaryCtaLink>
        </div>
      </div>
    </ContactFormShell>
  );
}
