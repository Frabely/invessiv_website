"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { LinkedInPostExampleSample } from "@/i18n/dictionaries/linkedin-post/example";
import { LinkedinPost } from "@/components/marketing/linkedin-post/linkedin-post/linkedin-post";
import styles from "./sample-card.module.css";

type SampleCardProps = {
  captionLess: string;
  captionMore: string;
  disclaimer: string;
  inputLabel: string;
  outputLabel: string;
  roleFieldLabel: string;
  sample: LinkedInPostExampleSample;
  toneFieldLabel: string;
  topicFieldLabel: string;
};

const DESKTOP_QUERY = "(min-width: 720px)";

function useDesktopExpansion() {
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }

    const mediaQuery = window.matchMedia(DESKTOP_QUERY);
    const updateExpansion = () => setIsExpanded(mediaQuery.matches);

    updateExpansion();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", updateExpansion);
      return () => mediaQuery.removeEventListener("change", updateExpansion);
    }

    mediaQuery.addListener(updateExpansion);
    return () => mediaQuery.removeListener(updateExpansion);
  }, []);

  return [isExpanded, setIsExpanded] as const;
}

export function SampleCard({
  captionLess,
  captionMore,
  disclaimer,
  inputLabel,
  outputLabel,
  roleFieldLabel,
  sample,
  toneFieldLabel,
  topicFieldLabel,
}: SampleCardProps) {
  const [isInputOpen, setIsInputOpen] = useDesktopExpansion();

  return (
    <div className={styles.flow}>
      <div className={styles.outputRail}>
        <div className={styles.outputHeader}>
          <p className={styles.sectionLabel}>{outputLabel}</p>
        </div>

        <LinkedinPost
          ariaLabel={sample.topicLabel}
          author={{
            avatar: { kind: "initials", value: sample.author.avatarInitials },
            name: sample.author.name,
            role: sample.author.role,
          }}
          caption={sample.caption}
          captionLess={captionLess}
          captionMore={captionMore}
          image={
            <figure
              aria-label={sample.image.headline}
              className={styles.postImage}
            >
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
                    <p aria-hidden="true" className={styles.postImageMark}>
                      #{sample.id.replace("sample-", "")}
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
          }
        />

        <p className={styles.disclaimer}>{disclaimer}</p>
      </div>

      <div className={styles.inputDisclosure}>
        <button
          aria-expanded={isInputOpen}
          aria-controls={`input-panel-${sample.id}`}
          className={styles.inputToggle}
          onClick={() => setIsInputOpen((current) => !current)}
          type="button"
        >
          <span className={styles.sectionLabel}>{inputLabel}</span>
          <span className={styles.inputToggleText}>
            {isInputOpen ? "Ausblenden" : "Einblenden"}
          </span>
        </button>

        <div
          className={styles.inputPanel}
          hidden={!isInputOpen}
          id={`input-panel-${sample.id}`}
        >
          <dl className={styles.inputGrid}>
            <div className={styles.inputItem}>
              <dt className={styles.inputItemLabel}>{topicFieldLabel}</dt>
              <dd className={styles.inputItemValue}>{sample.topicLabel}</dd>
            </div>
            <div className={styles.inputItem}>
              <dt className={styles.inputItemLabel}>{roleFieldLabel}</dt>
              <dd className={styles.inputItemValue}>{sample.author.role}</dd>
            </div>
            <div className={styles.inputItem}>
              <dt className={styles.inputItemLabel}>{toneFieldLabel}</dt>
              <dd className={styles.inputItemValue}>{sample.toneLabel}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
