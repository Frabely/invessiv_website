"use client";

import { useState } from "react";
import { KlarkompassCta } from "@/references/klarkompass-coaching/components/klarkompass-cta/klarkompass-cta";
import { KlarkompassEyebrow } from "@/references/klarkompass-coaching/components/klarkompass-eyebrow/klarkompass-eyebrow";
import {
  Reveal,
  RevealGroup,
} from "@/references/klarkompass-coaching/components/klarkompass-reveal/klarkompass-reveal";
import type { Locale } from "@/config/i18n";
import type { KlarkompassFaqContent } from "@/references/klarkompass-coaching/i18n/content";
import { FaqItem } from "./faq-item/faq-item";
import styles from "./faq-section.module.css";

type FaqSectionProps = KlarkompassFaqContent & {
  id: string;
  locale: Locale;
  ctaHref: string;
  ctaLabel: string;
  mockAlertMessage: string;
};

export function FaqSection({
  contactPrompt,
  ctaHref,
  ctaLabel,
  eyebrow,
  id,
  items,
  lead,
  locale,
  mockAlertMessage,
  title,
}: FaqSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className={styles.section} id={id} lang={locale}>
      <RevealGroup as="div" className={styles.intro}>
        <Reveal as="div" className={styles.introInner}>
          <KlarkompassEyebrow>{eyebrow}</KlarkompassEyebrow>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.lead}>{lead}</p>
        </Reveal>
      </RevealGroup>

      <RevealGroup as="div" className={styles.list}>
        {items.map((item, index) => (
          <Reveal as="div" key={item.question}>
            <FaqItem
              contentId={`${id}-panel-${index}`}
              isOpen={openIndex === index}
              item={item}
              onToggle={() =>
                setOpenIndex((current) => (current === index ? null : index))
              }
              triggerId={`${id}-trigger-${index}`}
            />
          </Reveal>
        ))}
      </RevealGroup>

      <RevealGroup as="div" className={styles.nudge}>
        <Reveal as="div" className={styles.nudgeText}>
          {contactPrompt}
        </Reveal>
        <Reveal as="div" className={styles.nudgeAction}>
          <KlarkompassCta
            href={ctaHref}
            label={ctaLabel}
            mockAlertMessage={mockAlertMessage}
            variant="secondary"
          />
        </Reveal>
      </RevealGroup>
    </section>
  );
}
