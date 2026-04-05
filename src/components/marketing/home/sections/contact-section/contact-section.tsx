"use client";

import { useEffect, useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import { getContactTarget } from "@/lib/analytics/get-contact-target";
import { SECTION_HREFS } from "@/config/site";
import type { LandingSectionCopy } from "@/i18n/dictionaries/marketing/home";
import { ProjectRequestForm } from "@/components/marketing/home/sections/contact-section/project-request-form/project-request-form";

type ContactCta = NonNullable<LandingSectionCopy["contactCta"]>;
type ContactChannel = NonNullable<
  LandingSectionCopy["contactChannels"]
>[number];
type ContactForm = NonNullable<LandingSectionCopy["contactForm"]>;
type ChannelMode = "email" | "call";

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
  contactSecondaryCta,
  description,
  id,
  privacyHref,
  title,
}: ContactSectionProps) {
  const [copiedEntryId, setCopiedEntryId] = useState<string | null>(null);
  const [copyStatusMessage, setCopyStatusMessage] = useState("");

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
    return channel.href.startsWith("tel:") ? "call" : "email";
  };

  const isExternalLink = (href: string) => /^https?:\/\//i.test(href);
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
    if (!copiedEntryId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setCopiedEntryId((previous) =>
        previous === copiedEntryId ? null : previous,
      );
    }, 1800);

    return () => window.clearTimeout(timeoutId);
  }, [copiedEntryId]);

  const copyChannelValue = async (entry: ContactEntry) => {
    if (!entry.channel?.copyValue) {
      return;
    }

    const valueToCopy = entry.channel.copyValue;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(valueToCopy);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = valueToCopy;
        textarea.setAttribute("readonly", "true");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      setCopiedEntryId(entry.id);
      setCopyStatusMessage(entry.channel.copiedLabel ?? "Copied");
    } catch {
      setCopiedEntryId(null);
      setCopyStatusMessage(entry.channel.copyLabel ?? "Copy unavailable");
    }
  };

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
    <section className="contact-section" id={id}>
      <div className="contact-section-stack">
        <div className="contact-brief-head">
          <h2>{title}</h2>
          <p className="contact-decision-intro">
            {contactDecisionIntro ?? description}
          </p>
        </div>

        {entries.length ? (
          <>
            <div
              className="contact-entry-picker"
              role="tablist"
              aria-label="Kontaktwege"
            >
              {entries.map((entry, entryIndex) => {
                const isActive = activeEntryId === entry.id;

                return (
                  <button
                    aria-controls={`contact-entry-panel-${entry.id}`}
                    aria-selected={isActive}
                    className={`contact-entry-trigger${isActive ? " is-active" : ""}`}
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
                      <span className="contact-entry-trigger-kicker">
                        {entry.kicker}
                      </span>
                    ) : null}
                    <span className="contact-entry-trigger-title">
                      {entry.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <p
              className="contact-screen-reader-status"
              role="status"
              aria-live="polite"
            >
              {copyStatusMessage}
            </p>

            {entries.map((entry) => {
              const isActive = activeEntryId === entry.id;
              const channelMode =
                entry.kind === "channel" && entry.channel
                  ? getChannelMode(entry.channel)
                  : null;
              const isExternalChannelLink =
                entry.kind === "channel" && entry.channel
                  ? isExternalLink(entry.channel.href)
                  : false;

              return (
                <article
                  aria-labelledby={`contact-entry-tab-${entry.id}`}
                  className={`contact-entry-panel${entry.kind === "project" ? " contact-entry-panel--project" : ""}${channelMode ? ` contact-entry-panel--${channelMode}` : ""}`}
                  hidden={!isActive}
                  id={`contact-entry-panel-${entry.id}`}
                  key={`panel-${entry.id}`}
                  role="tabpanel"
                >
                  {entry.kind === "project" && primaryPath ? (
                    <>
                      <ProjectRequestForm
                        bottomHint={primaryPath.cta.hint}
                        formCopy={primaryPath.form}
                        offerOptions={contactFormOffers}
                        privacyHref={privacyHref}
                        privacyLabel={primaryPath.form.privacyLabel}
                      />
                    </>
                  ) : null}

                  {entry.kind === "channel" && entry.channel ? (
                    <div className="contact-channel-panel">
                      <div className="contact-channel-panel-head">
                        <h4 className="contact-entry-panel-title">
                          {entry.label}
                        </h4>
                        {entry.description ? (
                          <p className="contact-entry-panel-description">
                            {entry.description}
                          </p>
                        ) : null}
                      </div>

                      {channelMode === "email" ? (
                        <div className="contact-channel-email-card">
                          <div className="contact-channel-meta">
                            <p className="contact-channel-meta-label">
                              {entry.channel.metaLabel ?? "Kontakt"}
                            </p>
                            <p className="contact-channel-meta-value">
                              {entry.channel.value}
                            </p>
                          </div>
                          {entry.channel.copyValue ? (
                            <button
                              className="contact-channel-copy-button"
                              onClick={() => copyChannelValue(entry)}
                              type="button"
                            >
                              {copiedEntryId === entry.id
                                ? (entry.channel.copiedLabel ?? "Copied")
                                : (entry.channel.copyLabel ?? "Copy")}
                            </button>
                          ) : null}
                        </div>
                      ) : (
                        <div className="contact-channel-call-card">
                          <p className="contact-channel-meta-label">
                            {entry.channel.metaLabel ?? "Format"}
                          </p>
                          <p className="contact-channel-meta-value">
                            {entry.channel.metaValue ?? entry.channel.value}
                          </p>
                        </div>
                      )}

                      {entry.channel.helper ? (
                        <p className="contact-entry-panel-helper">
                          {entry.channel.helper}
                        </p>
                      ) : null}

                      {entry.channel.detailPoints?.length ? (
                        <ul className="contact-channel-detail-list">
                          {entry.channel.detailPoints.map((point) => (
                            <li key={`${entry.id}-${point}`}>{point}</li>
                          ))}
                        </ul>
                      ) : null}

                      <div className="contact-channel-footer">
                        {entry.channel.hint ? (
                          <p className="contact-entry-panel-hint">
                            {entry.channel.hint}
                          </p>
                        ) : null}
                        <div className="contact-channel-actions">
                          <a
                            className={`contact-channel-action-link ${channelMode === "call" ? "contact-channel-action-link--call" : "contact-channel-action-link--email contact-primary-cta--shimmer"}`}
                            href={entry.channel.href}
                            rel={
                              isExternalChannelLink
                                ? "noopener noreferrer"
                                : undefined
                            }
                            target={
                              isExternalChannelLink ? "_blank" : undefined
                            }
                            data-analytics-event="contact_click"
                            data-analytics-location="contact"
                            data-analytics-target={
                              getContactTarget(entry.channel.href) ?? "email"
                            }
                          >
                            {entry.channel.actionLabel ?? "Kontakt aufnehmen"}
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </>
        ) : null}

        {contactSecondaryCta ? (
          <div className="contact-cta-wrap">
            <a
              className="contact-secondary-link"
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
