"use client";

import Image from "next/image";
import type { LinkedInPostExampleSample } from "@/i18n/dictionaries/linkedin-post/example";
import { LinkedinPost } from "@/components/marketing/linkedin-post/linkedin-post/linkedin-post";
import styles from "./sample-card.module.css";

type SampleCardProps = {
  captionLess: string;
  captionMore: string;
  promptLabel: string;
  sample: LinkedInPostExampleSample;
};

export function SampleCard({
  captionLess,
  captionMore,
  promptLabel,
  sample,
}: SampleCardProps) {
  return (
    <>
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
        }
      />

      <p className={styles.promptNote}>
        <span className={styles.promptNoteLabel}>{promptLabel}</span>
        <span className={styles.promptNoteText}>{sample.promptText}</span>
      </p>
    </>
  );
}
