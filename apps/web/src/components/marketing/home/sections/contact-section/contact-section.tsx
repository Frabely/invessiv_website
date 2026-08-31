"use client";

import { useEffect, useRef } from "react";
import { CONTACT_EMAIL_SECTION_HREF } from "@/config/navigation/home";
import type {
  ContactFormCopy,
  ContactPortraitCopy,
} from "@/i18n/dictionaries/marketing/home";
import { EyebrowPill } from "@/components/shared/eyebrow-pill/eyebrow-pill";
import { ContactForm } from "@/components/marketing/home/sections/contact-section/contact-form/contact-form";
import { useStaggeredSectionReveal } from "@/hooks/marketing/use-staggered-section-reveal";
import styles from "./contact-section.module.css";

type ContactSectionProps = {
  calendlyHref: string;
  contactForm: ContactFormCopy;
  eyebrow: string;
  id: string;
  intro: string;
  portrait: ContactPortraitCopy;
  privacyHref: string;
  title: string;
};

const CONTACT_SECTION_EVENTS = {
  Click: "click",
  HashChange: "hashchange",
} as const;

export function ContactSection({
  calendlyHref,
  contactForm,
  eyebrow,
  id,
  intro,
  portrait,
  privacyHref,
  title,
}: ContactSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const formColumnRef = useRef<HTMLDivElement | null>(null);

  useStaggeredSectionReveal(sectionRef, title);

  useEffect(() => {
    const focusFirstField = () => {
      formColumnRef.current?.querySelector("input")?.focus();
    };

    const handleHashChange = () => {
      if (window.location.hash === CONTACT_EMAIL_SECTION_HREF) {
        focusFirstField();
      }
    };

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      if (target.closest(`a[href="${CONTACT_EMAIL_SECTION_HREF}"]`) !== null) {
        focusFirstField();
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
  }, []);

  return (
    <section className={styles.section} id={id} ref={sectionRef}>
      <header className={styles.head} data-reveal-item="true">
        <EyebrowPill>{eyebrow}</EyebrowPill>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.intro}>{intro}</p>
      </header>

      <div
        className={styles.formColumn}
        data-reveal-item="true"
        ref={formColumnRef}
      >
        <ContactForm
          calendlyHref={calendlyHref}
          formCopy={contactForm}
          privacyHref={privacyHref}
          portrait={portrait}
        />
      </div>

      <span aria-hidden="true" id={CONTACT_EMAIL_SECTION_HREF.slice(1)} />
    </section>
  );
}
