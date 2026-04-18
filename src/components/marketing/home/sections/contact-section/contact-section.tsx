"use client";

import { useEffect, useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
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

type ContactEntry = {
  id: string;
  kind: "project" | "channel";
  label: string;
  kicker?: string;
  description?: string;
  channel?: ContactChannel;
};

const CONTACT_SECTION_LINK_SELECTOR = `a[href='${SECTION_HREFS.contact}']`;

export function ContactSection({
  contactCta,
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

  const entries = useMemo(() => {
    const nextEntries: ContactEntry[] = [];

    if (primaryPath) {
      nextEntries.push({
        id: "project",
        kind: "project",
        label: primaryPath.form.title,
        kicker: primaryPath.cta.kicker,
        description: primaryPath.cta.description ?? primaryPath.form.subtitle,
      });
    }

    contactChannels.forEach((channel, index) => {
      nextEntries.push({
        id: `channel-${index}`,
        kind: "channel",
        label: channel.label,
        kicker: channel.kicker,
        description: channel.description,
        channel,
      });
    });

    return nextEntries;
  }, [contactChannels, primaryPath]);

  const [selectedEntryId, setSelectedEntryId] = useState(entries[0]?.id ?? "");

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

  const activeEntryId = useMemo(() => {
    if (!entries.length) {
      return "";
    }

    const hasSelectedEntry = entries.some(
      (entry) => entry.id === selectedEntryId,
    );
    return hasSelectedEntry ? selectedEntryId : entries[0].id;
  }, [entries, selectedEntryId]);

  useEffect(() => {
    if (!primaryPath) {
      return;
    }

    const activateProjectEntry = () => {
      if (window.location.hash === SECTION_HREFS.contact) {
        setSelectedEntryId("project");
      }
    };

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const contactAnchor = target.closest(CONTACT_SECTION_LINK_SELECTOR);
      if (contactAnchor) {
        setSelectedEntryId("project");
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

  const handleEntryKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (!entries.length) {
      return;
    }

    if (
      event.key !== "ArrowRight" &&
      event.key !== "ArrowLeft" &&
      event.key !== "Home" &&
      event.key !== "End"
    ) {
      return;
    }

    event.preventDefault();

    let nextIndex = index;
    if (event.key === "ArrowRight") {
      nextIndex = (index + 1) % entries.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (index - 1 + entries.length) % entries.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = entries.length - 1;
    }

    const nextEntry = entries[nextIndex];
    if (!nextEntry) {
      return;
    }

    setSelectedEntryId(nextEntry.id);
    const nextButton = document.getElementById(
      `contact-entry-tab-${nextEntry.id}`,
    );
    if (nextButton instanceof HTMLButtonElement) {
      nextButton.focus();
    }
  };

  return (
    <section className={styles.section} id={id}>
      <div className={styles.stack}>
        <div className={styles.briefHead}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.decisionIntro}>
            {contactDecisionIntro ?? description}
          </p>
        </div>

        {entries.length ? (
          <>
            <div
              className={styles.entryPicker}
              role="tablist"
              aria-label="Kontaktwege"
            >
              {entries.map((entry, entryIndex) => {
                const isActive = activeEntryId === entry.id;

                return (
                  <button
                    aria-controls={`contact-entry-panel-${entry.id}`}
                    aria-selected={isActive}
                    className={`${styles.entryTrigger}${isActive ? ` ${styles.entryTriggerActive}` : ""}`}
                    id={`contact-entry-tab-${entry.id}`}
                    key={entry.id}
                    onKeyDown={(event) => {
                      handleEntryKeyDown(event, entryIndex);
                    }}
                    onClick={() => setSelectedEntryId(entry.id)}
                    role="tab"
                    type="button"
                  >
                    {entry.kicker ? (
                      <span className={styles.entryTriggerKicker}>
                        {entry.kicker}
                      </span>
                    ) : null}
                    <span className={styles.entryTriggerTitle}>
                      {entry.label}
                    </span>
                  </button>
                );
              })}
            </div>
            {entries.map((entry) => {
              const isActive = activeEntryId === entry.id;
              const channelMode =
                entry.kind === "channel" && entry.channel
                  ? getChannelMode(entry.channel)
                  : null;

              return (
                <article
                  aria-labelledby={`contact-entry-tab-${entry.id}`}
                  className={`${styles.entryPanel}${entry.kind === "project" ? ` ${styles.entryPanelProject}` : ""}`}
                  hidden={!isActive}
                  id={`contact-entry-panel-${entry.id}`}
                  key={`panel-${entry.id}`}
                  role="tabpanel"
                >
                  {entry.kind === "project" && primaryPath ? (
                    <>
                      <ProjectRequestForm
                        formCopy={primaryPath.form}
                        offerOptions={contactFormOffers}
                        privacyHref={privacyHref}
                        privacyLabel={primaryPath.form.privacyLabel}
                      />
                    </>
                  ) : null}

                  {entry.kind === "channel" && entry.channel ? (
                    channelMode === "email" && quickContactForm ? (
                      <QuickContactForm
                        channel={entry.channel}
                        formCopy={quickContactForm}
                        privacyHref={privacyHref}
                      />
                    ) : channelMode === "call" && discoveryCallForm ? (
                      <DiscoveryCallPanel
                        channel={entry.channel}
                        formCopy={discoveryCallForm}
                        privacyHref={privacyHref}
                      />
                    ) : null
                  ) : null}
                </article>
              );
            })}
          </>
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
