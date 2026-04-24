"use client";

import { useEffect, useMemo, useState } from "react";
import { getContactTarget } from "@/lib/analytics/get-contact-target";
import { SECTION_HREFS } from "@/config/site";
import type { LandingSectionCopy } from "@/i18n/dictionaries/marketing/home";
import { DiscoveryCallPanel } from "@/components/marketing/home/sections/contact-section/discovery-call-panel/discovery-call-panel";
import { ProjectRequestForm } from "@/components/marketing/home/sections/contact-section/project-request-form/project-request-form";
import { QuickContactForm } from "@/components/marketing/home/sections/contact-section/quick-contact-form/quick-contact-form";
import styles from "./contact-section.module.css";

type ContactCta = NonNullable<LandingSectionCopy["contactCta"]>;
type ContactChannel = NonNullable<
  LandingSectionCopy["contactChannels"]
>[number];
type ContactForm = NonNullable<LandingSectionCopy["contactForm"]>;
type ContactSecondaryCta = NonNullable<
  LandingSectionCopy["contactSecondaryCta"]
>;
type QuickContactFormCopy = NonNullable<LandingSectionCopy["quickContactForm"]>;
type DiscoveryCallFormCopy = NonNullable<
  LandingSectionCopy["discoveryCallForm"]
>;
type ChannelMode = "email" | "call";

type ContactSectionProps = {
  contactCta?: ContactCta;
  contactAlternativeLabel?: string;
  contactChannels: ContactChannel[];
  contactDecisionIntro?: string;
  contactForm?: ContactForm;
  contactFormOffers: Array<{ key: string; title: string }>;
  discoveryCallForm?: DiscoveryCallFormCopy;
  quickContactForm?: QuickContactFormCopy;
  contactSecondaryCta?: ContactSecondaryCta;
  description: string;
  id: string;
  privacyHref: string;
  title: string;
};

const CONTACT_SECTION_LINK_SELECTOR = `a[href='${SECTION_HREFS.contact}']`;

export function ContactSection({
  contactCta,
  contactAlternativeLabel,
  contactChannels,
  contactDecisionIntro,
  contactForm,
  contactFormOffers,
  discoveryCallForm,
  quickContactForm,
  contactSecondaryCta,
  description,
  id,
  privacyHref,
  title,
}: ContactSectionProps) {
  const primaryPath = useMemo(
    () =>
      contactCta && contactForm ? { cta: contactCta, form: contactForm } : null,
    [contactCta, contactForm],
  );

  const [selectedChannelIndex, setSelectedChannelIndex] = useState<
    number | null
  >(null);

  const getChannelMode = (channel: ContactChannel): ChannelMode => {
    if (channel.mode) {
      return channel.mode;
    }
    return channel.href.startsWith("mailto:") ? "email" : "call";
  };

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
    if (!primaryPath) {
      return;
    }

    const activateProjectEntry = () => {
      if (window.location.hash === SECTION_HREFS.contact) {
        setSelectedChannelIndex(null);
      }
    };

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const contactAnchor = target.closest(CONTACT_SECTION_LINK_SELECTOR);
      if (contactAnchor) {
        setSelectedChannelIndex(null);
      }
    };

    activateProjectEntry();
    window.addEventListener("hashchange", activateProjectEntry);
    document.addEventListener("click", handleDocumentClick);

    return () => {
      window.removeEventListener("hashchange", activateProjectEntry);
      document.removeEventListener("click", handleDocumentClick);
    };
  }, [primaryPath]);

  return (
    <section className={styles.section} id={id}>
      <div className={styles.stack}>
        <div className={styles.briefHead}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.decisionIntro}>
            {contactDecisionIntro ?? description}
          </p>
        </div>

        {primaryPath ? (
          <article
            className={`${styles.entryPanel} ${styles.entryPanelProject}`}
          >
            <ProjectRequestForm
              formCopy={primaryPath.form}
              offerOptions={contactFormOffers}
              privacyHref={privacyHref}
              privacyLabel={primaryPath.form.privacyLabel}
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

            {selectedChannel ? (
              <div
                className={styles.secondaryPathPanel}
                id={`contact-channel-${selectedChannelIndex}-panel`}
              >
                {getChannelMode(selectedChannel) === "email" &&
                quickContactForm ? (
                  <QuickContactForm
                    channel={selectedChannel}
                    formCopy={quickContactForm}
                    privacyHref={privacyHref}
                  />
                ) : null}
                {getChannelMode(selectedChannel) === "call" &&
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
