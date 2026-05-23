"use client";

import { useEffect, useState } from "react";
import { getContactTarget } from "@/lib/analytics/get-contact-target";
import {
  CONTACT_CHANNEL_MODES,
  CONTACT_EMAIL_SECTION_HREF,
  SECTION_HREFS,
} from "@/config/navigation/home";
import type {
  ContactChannelCopy,
  ContactFormCopy,
  ContactSecondaryCtaCopy,
  DiscoveryCallFormCopy,
  QuickContactFormCopy,
} from "@/i18n/dictionaries/marketing/home";
import { DiscoveryCallPanel } from "@/components/marketing/home/sections/contact-section/discovery-call-panel/discovery-call-panel";
import { ProjectRequestForm } from "@/components/marketing/home/sections/contact-section/project-request-form/project-request-form";
import { QuickContactForm } from "@/components/marketing/home/sections/contact-section/quick-contact-form/quick-contact-form";
import styles from "./contact-section.module.css";

type ContactSectionProps = {
  contactAlternativeLabel?: string;
  contactChannels: ContactChannelCopy[];
  contactDecisionIntro: string;
  contactForm?: ContactFormCopy;
  contactFormOffers: Array<{ key: string; title: string }>;
  discoveryCallForm?: DiscoveryCallFormCopy;
  quickContactForm?: QuickContactFormCopy;
  contactSecondaryCta?: ContactSecondaryCtaCopy;
  id: string;
  privacyHref: string;
  title: string;
};

const CONTACT_SECTION_EVENTS = {
  Click: "click",
  HashChange: "hashchange",
} as const;

export function ContactSection({
  contactAlternativeLabel,
  contactChannels,
  contactDecisionIntro,
  contactForm,
  contactFormOffers,
  discoveryCallForm,
  quickContactForm,
  contactSecondaryCta,
  id,
  privacyHref,
  title,
}: ContactSectionProps) {
  const [selectedChannelIndex, setSelectedChannelIndex] = useState<
    number | null
  >(null);

  const getSecondaryCtaAnalyticsProps = (href: string) => {
    const contactTarget = getContactTarget(href);
    if (contactTarget) {
      return {
        "data-analytics-event": "contact_click",
        "data-analytics-location": "contact",
        "data-analytics-target": contactTarget,
      };
    }
    return {
      "data-analytics-event": "cta_click",
      "data-analytics-location": "contact",
      "data-analytics-variant": "secondary",
      ...(href === SECTION_HREFS.contact
        ? { "data-analytics-target": "form" }
        : {}),
    };
  };

  const selectedChannel =
    selectedChannelIndex === null
      ? null
      : (contactChannels[selectedChannelIndex] ?? null);

  useEffect(() => {
    const nextChannelIndex = contactChannels.findIndex(
      (channel) => channel.mode === CONTACT_CHANNEL_MODES.Email,
    );

    const openEmailChannel = () => {
      if (nextChannelIndex >= 0) {
        setSelectedChannelIndex(nextChannelIndex);
        return;
      }

      setSelectedChannelIndex(null);
    };

    const handleHashChange = () => {
      if (window.location.hash === CONTACT_EMAIL_SECTION_HREF) {
        openEmailChannel();
        return;
      }

      setSelectedChannelIndex(null);
    };

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      if (target.closest(`a[href="${CONTACT_EMAIL_SECTION_HREF}"]`) !== null) {
        openEmailChannel();
      }
    };

    handleHashChange();
    window.addEventListener(
      CONTACT_SECTION_EVENTS.HashChange,
      handleHashChange,
    );
    document.addEventListener(
      CONTACT_SECTION_EVENTS.Click,
      handleDocumentClick,
    );

    return () => {
      window.removeEventListener(
        CONTACT_SECTION_EVENTS.HashChange,
        handleHashChange,
      );
      document.removeEventListener(
        CONTACT_SECTION_EVENTS.Click,
        handleDocumentClick,
      );
    };
  }, [contactChannels]);

  return (
    <section className={styles.section} id={id}>
      <div className={styles.stack}>
        <div className={styles.briefHead}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.decisionIntro}>{contactDecisionIntro}</p>
        </div>

        {contactForm ? (
          <article
            className={`${styles.entryPanel} ${styles.entryPanelProject}`}
          >
            <ProjectRequestForm
              formCopy={contactForm}
              offerOptions={contactFormOffers}
              privacyHref={privacyHref}
              privacyLabel={contactForm.privacyLabel}
            />
          </article>
        ) : null}

        {contactChannels.length ? (
          <aside className={styles.secondaryPaths}>
            <div className={styles.secondaryPathsIntro}>
              <p>{contactAlternativeLabel}</p>
            </div>
            <div className={styles.secondaryPathGrid}>
              {contactChannels.map((channel, index) => {
                const channelId = `contact-channel-${index}`;
                const isActive = selectedChannelIndex === index;

                return (
                  <button
                    aria-controls={`${channelId}-panel`}
                    aria-expanded={isActive}
                    className={`${styles.secondaryPathTrigger}${isActive ? ` ${styles.secondaryPathTriggerActive}` : ""}`}
                    key={channelId}
                    onClick={() =>
                      setSelectedChannelIndex(isActive ? null : index)
                    }
                    type="button"
                  >
                    {channel.kicker ? (
                      <span className={styles.secondaryPathKicker}>
                        {channel.kicker}
                      </span>
                    ) : null}
                    <span className={styles.secondaryPathTitle}>
                      {channel.label}
                    </span>
                    {channel.description ? (
                      <span className={styles.secondaryPathDescription}>
                        {channel.description}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <span aria-hidden="true" id={CONTACT_EMAIL_SECTION_HREF.slice(1)} />

            {selectedChannel ? (
              <div
                className={styles.secondaryPathPanel}
                id={`contact-channel-${selectedChannelIndex}-panel`}
              >
                {selectedChannel.mode === CONTACT_CHANNEL_MODES.Email &&
                quickContactForm ? (
                  <QuickContactForm
                    channel={selectedChannel}
                    formCopy={quickContactForm}
                    privacyHref={privacyHref}
                  />
                ) : null}
                {selectedChannel.mode === CONTACT_CHANNEL_MODES.Call &&
                discoveryCallForm ? (
                  <DiscoveryCallPanel
                    channel={selectedChannel}
                    formCopy={discoveryCallForm}
                    privacyHref={privacyHref}
                  />
                ) : null}
              </div>
            ) : null}
          </aside>
        ) : null}

        {contactSecondaryCta ? (
          <div className={styles.ctaWrap}>
            <a
              className={styles.secondaryLink}
              href={contactSecondaryCta.href}
              {...getSecondaryCtaAnalyticsProps(contactSecondaryCta.href)}
            >
              {contactSecondaryCta.label}
            </a>
          </div>
        ) : null}
      </div>
    </section>
  );
}
