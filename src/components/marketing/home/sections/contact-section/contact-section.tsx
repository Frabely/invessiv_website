"use client";

import { useEffect, useMemo, useState } from "react";
import type { KeyboardEvent } from "react";
import type { LandingSectionCopy } from "@/i18n/dictionaries/marketing/home";
import { ProjectRequestForm } from "@/components/marketing/home/sections/contact-section/project-request-form/project-request-form";
import { SectionScanPoints } from "@/components/marketing/home/shared/section-scan-points/section-scan-points";
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

export function ContactSection({
  contactCta,
  contactChannels,
  contactChecklist,
  contactChecklistHint,
  contactChecklistTitle,
  contactDecisionIntro,
  contactForm,
  contactFormOffers,
  contactSecondaryCta,
  description,
  id,
  privacyHref,
  summaryPoints,
  title,
}: ContactSectionProps) {
  const primaryPath = useMemo(
    () =>
      contactCta && contactForm
        ? { cta: contactCta, form: contactForm }
        : null,
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
  const activeEntryId = useMemo(() => {
    if (!entries.length) {
      return "";
    }

    const hasSelectedEntry = entries.some((entry) => entry.id === selectedEntryId);
    return hasSelectedEntry ? selectedEntryId : entries[0].id;
  }, [entries, selectedEntryId]);

  useEffect(() => {
    if (!primaryPath) {
      return;
    }

    const activateProjectEntry = () => {
      if (window.location.hash === "#contact") {
        setSelectedEntryId("project");
      }
    };

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const contactAnchor = target.closest("a[href='#contact']");
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
      <div className="contact-layout">
        <div className="contact-brief-card">
          <h2>{title}</h2>
          <p className="contact-decision-intro">
            {contactDecisionIntro ?? description}
          </p>

          {summaryPoints?.length ? (
            <SectionScanPoints
              fallbackClassName="contact-hint"
              fallbackText={description}
              points={summaryPoints}
            />
          ) : null}

          {entries.length ? (
            <>
              {contactChecklistTitle ? (
                <h3 className="contact-entry-title">{contactChecklistTitle}</h3>
              ) : null}
              {contactChecklistHint ? (
                <p className="contact-entry-subtitle">{contactChecklistHint}</p>
              ) : null}

              <div
                className="contact-entry-picker"
                role="tablist"
                aria-label={contactChecklistTitle ?? "Kontaktwege"}
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
                        <span className="contact-entry-trigger-kicker">{entry.kicker}</span>
                      ) : null}
                      <span className="contact-entry-trigger-title">{entry.label}</span>
                    </button>
                  );
                })}
              </div>

              {entries.map((entry) => {
                const isActive = activeEntryId === entry.id;

                return (
                  <article
                    aria-labelledby={`contact-entry-tab-${entry.id}`}
                    className={`contact-entry-panel${entry.kind === "project" ? " contact-entry-panel--project" : ""}`}
                    hidden={!isActive}
                    id={`contact-entry-panel-${entry.id}`}
                    key={`panel-${entry.id}`}
                    role="tabpanel"
                  >
                    {entry.kind === "channel" ? (
                      <h4 className="contact-entry-panel-title">{entry.label}</h4>
                    ) : null}
                    {entry.kind === "channel" && entry.description ? (
                      <p className="contact-entry-panel-description">{entry.description}</p>
                    ) : null}

                    {entry.kind === "project" && primaryPath ? (
                      <>
                        <ProjectRequestForm
                          formCopy={primaryPath.form}
                          offerOptions={contactFormOffers}
                          openButtonLabel={primaryPath.cta.label}
                          privacyHref={privacyHref}
                          privacyLabel={primaryPath.form.privacyLabel}
                          submitHref={COMPANY_MAILTO}
                        />
                        {primaryPath.cta.hint ? (
                          <p className="contact-entry-panel-hint">{primaryPath.cta.hint}</p>
                        ) : null}
                      </>
                    ) : null}

                    {entry.kind === "channel" && entry.channel ? (
                      <>
                        <p className="contact-entry-panel-value">{entry.channel.value}</p>
                        <a
                          className="contact-channel-action-link contact-channel-action-link--secondary"
                          href={entry.channel.href}
                        >
                          {entry.channel.actionLabel ?? "Kontakt aufnehmen"}
                        </a>
                        {entry.channel.hint ? (
                          <p className="contact-entry-panel-hint">{entry.channel.hint}</p>
                        ) : null}
                      </>
                    ) : null}
                  </article>
                );
              })}
            </>
          ) : null}

          {contactChecklist.length ? (
            <ul className="contact-trust-list">
              {contactChecklist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}

          {contactSecondaryCta ? (
            <div className="contact-cta-wrap">
              <a className="btn btn--ghost" href={contactSecondaryCta.href}>
                {contactSecondaryCta.label}
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
