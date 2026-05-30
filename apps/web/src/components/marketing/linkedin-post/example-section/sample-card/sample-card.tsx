"use client";

import Image from "next/image";
import { useId, useState } from "react";
import type { LinkedInPostExampleSample } from "@/i18n/dictionaries/linkedin-post/example";
import styles from "./sample-card.module.css";

type SampleCardProps = {
  captionLess: string;
  captionMore: string;
  promptLabel: string;
  sample: LinkedInPostExampleSample;
};

/**
 * A single example post styled like a classic LinkedIn post:
 * profile → caption (with "… more" truncation) → full-bleed square image,
 * followed by the prompt note that produced it. The carousel/grid wrapper
 * (`<li>`) and its layout live in the parent example-section.
 *
 * When `sample.image.src` is provided the real 1080×1080 PNG is shown;
 * otherwise the CSS-generated placeholder renders as fallback.
 */
export function SampleCard({
  captionLess,
  captionMore,
  promptLabel,
  sample,
}: SampleCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const captionId = useId();

  return (
    <>
      <article aria-label={sample.topicLabel} className={styles.card}>
        <header className={styles.author}>
          <span aria-hidden="true" className={styles.authorAvatar}>
            {sample.author.avatarInitials}
          </span>
          <span className={styles.authorMeta}>
            <span className={styles.authorName}>{sample.author.name}</span>
            <span className={styles.authorRole}>{sample.author.role}</span>
          </span>
        </header>

        <div className={styles.captionWrap}>
          <p
            className={styles.caption}
            data-expanded={isExpanded || undefined}
            id={captionId}
          >
            {sample.caption}
          </p>
          <button
            aria-controls={captionId}
            aria-expanded={isExpanded}
            className={styles.captionToggle}
            onClick={() => setIsExpanded((current) => !current)}
            type="button"
          >
            {isExpanded ? captionLess : captionMore}
          </button>
        </div>

        <figure aria-label={sample.image.headline} className={styles.postImage}>
          {sample.image.src ? (
            <Image
              alt={sample.image.headline}
              className={styles.postImageReal}
              fill
              quality={90}
              sizes="(max-width: 720px) 88vw, (max-width: 960px) 45vw, 460px"
              src={sample.image.src}
            />
          ) : (
            <>
              <span aria-hidden="true" className={styles.postImageGrid} />
              <span aria-hidden="true" className={styles.postImageGlow} />
              <div className={styles.postImageContent}>
                <p className={styles.postImageMark} aria-hidden="true">
                  ⌗ {sample.id.replace("sample-", "0")}
                </p>
                <h3 className={styles.postImageHeadline}>
                  {sample.image.headline}
                </h3>
                <p className={styles.postImageFootnote}>
                  {sample.image.footnote}
                </p>
              </div>
            </>
          )}
        </figure>
      </article>

      <p className={styles.promptNote}>
        <span className={styles.promptNoteLabel}>{promptLabel}</span>
        <span className={styles.promptNoteText}>{sample.promptText}</span>
      </p>
    </>
  );
}
