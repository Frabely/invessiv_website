"use client";

import Image from "next/image";
import { ReactNode, useId, useState } from "react";
import styles from "./linkedin-post.module.css";

type LinkedinPostAvatar =
  | { kind: "initials"; value: string }
  | { kind: "image"; src: string; alt: string };

export type LinkedinPostAuthor = {
  name?: string;
  role: string;
  avatar: LinkedinPostAvatar;
};

type LinkedinPostProps = {
  ariaLabel?: string;
  author: LinkedinPostAuthor;
  caption: ReactNode;
  captionLess?: string;
  captionMore?: string;
  image: ReactNode;
};

export function LinkedinPost({
  ariaLabel,
  author,
  caption,
  captionLess,
  captionMore,
  image,
}: LinkedinPostProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const captionId = useId();
  const hasToggle = Boolean(captionMore && captionLess);

  return (
    <article aria-label={ariaLabel} className={styles.card}>
      <header className={styles.author}>
        {author.avatar.kind === "initials" ? (
          <span aria-hidden="true" className={styles.authorAvatar}>
            {author.avatar.value}
          </span>
        ) : (
          <Image
            alt={author.avatar.alt}
            className={styles.authorAvatarImg}
            height={40}
            src={author.avatar.src}
            width={40}
          />
        )}
        <span className={styles.authorMeta}>
          {author.name ? (
            <span className={styles.authorName}>{author.name}</span>
          ) : null}
          <span className={styles.authorRole}>{author.role}</span>
        </span>
      </header>

      <div className={styles.captionWrap}>
        <p
          className={styles.caption}
          data-expanded={!hasToggle || isExpanded || undefined}
          id={captionId}
        >
          {caption}
        </p>
        {hasToggle ? (
          <button
            aria-controls={captionId}
            aria-expanded={isExpanded}
            className={styles.captionToggle}
            onClick={() => setIsExpanded((current) => !current)}
            type="button"
          >
            {isExpanded ? captionLess : captionMore}
          </button>
        ) : null}
      </div>

      {image}
    </article>
  );
}
