"use client";

import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import {
  REFERENCE_AVATAR_IMAGES,
  REFERENCE_IMAGES,
} from "@/common/constants/marketing/reference-images";
import { REFERENCE_IMAGE_DEVICE } from "@/common/constants/marketing/reference-image-device";
import { REFERENCE_SECTION_HREFS } from "@/common/constants/marketing/reference-section-hrefs";
import type { ReferenceEntry } from "@/common/contracts/marketing/reference-entry";
import type { ReferenceLabels } from "@/common/contracts/marketing/reference-labels";
import { ReferenceTestimonial } from "@/components/marketing/shared/reference-testimonial/reference-testimonial";
import { ButtonControl } from "@/components/shared/button/button";
import { useMediaQuery } from "@/hooks/marketing/use-media-query";
import styles from "./references-showcase.module.css";

type ReferencesShowcaseProps = {
  entries: ReferenceEntry[];
  labels: ReferenceLabels;
  referencesHref: string;
};

const STACK_MEDIA_QUERY = "(min-width: 760px)";
const STACK_TILT_DEGREES = [-4.2, 3.4, -2.6, 4.8];

export function ReferencesShowcase({
  entries,
  labels,
  referencesHref,
}: ReferencesShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const prefersReducedMotion = useReducedMotion();
  const usesStack = useMediaQuery(STACK_MEDIA_QUERY);

  const activeEntry = entries[activeIndex];
  const activeProjectHref = activeEntry
    ? `${referencesHref}${REFERENCE_SECTION_HREFS[activeEntry.imageKey]}`
    : referencesHref;
  const counterLabel = useMemo(
    () =>
      labels.counterTemplate
        .replace("{current}", String(activeIndex + 1))
        .replace("{total}", String(entries.length)),
    [activeIndex, entries.length, labels.counterTemplate],
  );

  if (!activeEntry) {
    return null;
  }

  const usesMotion = usesStack && !prefersReducedMotion;

  return (
    <div
      aria-label={labels.showcaseAriaLabel}
      className={styles.showcase}
      role="group"
    >
      <Link
        aria-label={`${activeEntry.linkLabel}: ${activeEntry.selectorLabel}`}
        className={styles.stage}
        href={activeProjectHref}
      >
        {entries.map((entry, index) => {
          const isActive = index === activeIndex;
          const stackOffset =
            (index - activeIndex + entries.length) % entries.length;

          return (
            <motion.div
              animate={{
                opacity: isActive ? 1 : 0.42,
                rotate:
                  usesMotion && !isActive
                    ? STACK_TILT_DEGREES[index % STACK_TILT_DEGREES.length]
                    : 0,
                scale: usesMotion && !isActive ? 0.97 : 1,
              }}
              className={styles.slide}
              initial={false}
              key={entry.imageKey}
              style={{ zIndex: entries.length - stackOffset }}
              transition={{
                duration: prefersReducedMotion ? 0.12 : 0.42,
                ease: "easeInOut",
              }}
            >
              <div
                className={styles.frame}
                data-device={REFERENCE_IMAGE_DEVICE[entry.imageKey]}
              >
                <div aria-hidden="true" className={styles.chrome}>
                  <span className={styles.chromeDot} />
                  <span className={styles.chromeDot} />
                  <span className={styles.chromeDot} />
                  <span className={styles.chromeAddress}>
                    {entry.siteLabel}
                  </span>
                </div>
                <div className={styles.viewport}>
                  <Image
                    alt={entry.imageAlt}
                    className={styles.image}
                    fill
                    placeholder="blur"
                    priority={false}
                    sizes="(max-width: 759px) 92vw, (max-width: 1279px) 46vw, 620px"
                    src={REFERENCE_IMAGES[entry.imageKey]}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </Link>

      <div className={styles.controls}>
        <p className={styles.counter}>{counterLabel}</p>
        <div className={styles.actions}>
          {entries.map((entry, index) => (
            <ButtonControl
              aria-pressed={index === activeIndex}
              className={styles.navButton}
              key={entry.imageKey}
              onClick={() => setActiveIndex(index)}
              variant="ghost"
            >
              {entry.selectorLabel}
            </ButtonControl>
          ))}
        </div>
      </div>

      <div className={styles.panel}>
        {activeEntry.avatarKey ? (
          <div
            aria-hidden="true"
            className={styles.portraitBackdrop}
            key={activeEntry.imageKey}
          >
            <Image
              alt=""
              className={styles.portraitBackdropImage}
              data-avatar={activeEntry.avatarKey}
              fill
              sizes="(max-width: 759px) 70vw, 440px"
              src={REFERENCE_AVATAR_IMAGES[activeEntry.avatarKey]}
            />
          </div>
        ) : null}

        <div aria-live="polite" className={styles.statement}>
          <ReferenceTestimonial
            authorName={activeEntry.authorName}
            avatarAlt={activeEntry.avatarAlt}
            avatarKey={activeEntry.avatarKey}
            collapseLabel={labels.collapseQuote}
            expandLabel={labels.expandQuote}
            key={activeEntry.imageKey}
            quote={activeEntry.quote}
            role={activeEntry.role}
          />

          <Link className={styles.projectDetailsLink} href={activeProjectHref}>
            {activeEntry.linkLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}
