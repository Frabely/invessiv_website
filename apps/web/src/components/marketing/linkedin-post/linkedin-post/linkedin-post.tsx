"use client";

import Image from "next/image";
import type { ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { LinkedinPostCaptionFit } from "@/common/constants";
import type { LinkedinPostAuthor } from "@/common/contracts";
import styles from "./linkedin-post.module.css";

const CAPTION_SCROLL_TOP_START = 0;
const MIN_MEASURABLE_CAPTION_HEIGHT_PX = 0;
const CAPTION_OVERFLOW_TOLERANCE_PX = 1;
const CAPTION_OVERFLOW_REMEASURE_DELAY_MS = 180;

type LinkedinPostProps = {
  ariaLabel?: string;
  author: LinkedinPostAuthor;
  caption: ReactNode;
  captionFit?: LinkedinPostCaptionFit;
  captionLess?: string;
  captionMore?: string;
  className?: string;
  headerAction?: ReactNode;
  image: ReactNode;
};

function collapsedCaptionToggleLabel(
  label: string | undefined,
): string | undefined {
  const normalizedLabel = label?.replace(/^[\s.…]+/u, "").trim();
  return normalizedLabel ? `… ${normalizedLabel}` : label;
}

export function LinkedinPost({
  ariaLabel,
  author,
  caption,
  captionFit = LinkedinPostCaptionFit.LineClamp,
  captionLess,
  captionMore,
  className,
  headerAction,
  image,
}: LinkedinPostProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasCaptionOverflow, setHasCaptionOverflow] = useState(false);
  const captionRef = useRef<HTMLParagraphElement | null>(null);
  const captionId = useId();
  const hasToggleLabels = Boolean(captionMore && captionLess);
  const hasToggle =
    hasToggleLabels &&
    (captionFit === LinkedinPostCaptionFit.LineClamp ||
      isExpanded ||
      hasCaptionOverflow);
  const collapsedToggleLabel = collapsedCaptionToggleLabel(captionMore);

  function resetCaptionScroll() {
    const captionElement = captionRef.current;
    if (captionElement) {
      captionElement.scrollTop = CAPTION_SCROLL_TOP_START;
    }
  }

  function handleCaptionToggle() {
    setIsExpanded((current) => {
      if (current) {
        resetCaptionScroll();
      }

      return !current;
    });
  }

  useEffect(() => {
    if (
      captionFit !== LinkedinPostCaptionFit.Available ||
      !hasToggleLabels ||
      isExpanded
    ) {
      return;
    }

    const captionElement = captionRef.current;
    if (!captionElement) {
      return;
    }

    const updateOverflow = () => {
      if (captionElement.clientHeight <= MIN_MEASURABLE_CAPTION_HEIGHT_PX) {
        return;
      }
      setHasCaptionOverflow(
        captionElement.scrollHeight >
          captionElement.clientHeight + CAPTION_OVERFLOW_TOLERANCE_PX,
      );
    };

    const frame = window.requestAnimationFrame(updateOverflow);
    const timeout = window.setTimeout(
      updateOverflow,
      CAPTION_OVERFLOW_REMEASURE_DELAY_MS,
    );

    if (typeof ResizeObserver === "undefined") {
      return () => {
        window.cancelAnimationFrame(frame);
        window.clearTimeout(timeout);
      };
    }

    const observer = new ResizeObserver(updateOverflow);
    observer.observe(captionElement);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
      observer.disconnect();
    };
  }, [caption, captionFit, hasToggleLabels, isExpanded]);

  return (
    <article
      aria-label={ariaLabel}
      className={className ? `${styles.card} ${className}` : styles.card}
      data-caption-fit={captionFit}
      data-caption-expanded={
        captionFit === LinkedinPostCaptionFit.Available && isExpanded
          ? true
          : undefined
      }
      data-caption-overflow={
        captionFit === LinkedinPostCaptionFit.Available &&
        hasCaptionOverflow &&
        !isExpanded
          ? true
          : undefined
      }
    >
      <header className={styles.header}>
        <div className={styles.author}>
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
        </div>

        {headerAction ? (
          <div className={styles.headerAction}>{headerAction}</div>
        ) : null}
      </header>

      <div className={styles.captionWrap}>
        <p
          className={styles.caption}
          data-expanded={!hasToggle || isExpanded || undefined}
          id={captionId}
          ref={captionRef}
        >
          {caption}
        </p>
        {hasToggle ? (
          <button
            aria-controls={captionId}
            aria-expanded={isExpanded}
            className={styles.captionToggle}
            onClick={handleCaptionToggle}
            type="button"
          >
            {isExpanded ? captionLess : collapsedToggleLabel}
          </button>
        ) : null}
      </div>

      {image}
    </article>
  );
}
