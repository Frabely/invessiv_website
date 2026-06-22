"use client";

import { useState } from "react";
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
};

export function FaqSection({ eyebrow, id, items, title }: FaqSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <RevealGroup as="section" className={styles.section} id={id}>
      <Reveal as="div" className={styles.intro}>
        <KlarkompassEyebrow>{eyebrow}</KlarkompassEyebrow>
        <h2 className={styles.title}>{title}</h2>
      </Reveal>

      <Reveal as="div" className={styles.list}>
        {items.map((item, index) => (
          <FaqItem
            contentId={`${id}-panel-${index}`}
            isOpen={openIndex === index}
            item={item}
            key={item.question}
            onToggle={() =>
              setOpenIndex((current) => (current === index ? null : index))
            }
            triggerId={`${id}-trigger-${index}`}
          />
        ))}
      </Reveal>
    </RevealGroup>
  );
}
