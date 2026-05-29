"use client";

import Image from "next/image";
import { useId, useState } from "react";
import type { Locale } from "@/config/i18n";
import { SITE_ROUTES } from "@/config/routes";
import type { LinkedInPostGeneratorCustomPostCopy } from "@/i18n/dictionaries/linkedin-post/generator";
import styles from "./custom-post-block.module.css";

const PROFILE_IMAGE_SRC = "/linkedin-post/moritz-hecht.jpeg";

type CustomPostBlockProps = {
  content: LinkedInPostGeneratorCustomPostCopy;
  locale: Locale;
};

/**
 * Shown in the generator success state, below the generated result. Displays a
 * real post produced by the internal workflow (profile, caption, branded image)
 * to contrast against the un-branded generator output and open the aspiration
 * gap toward a bespoke workflow.
 */
export function CustomPostBlock({ content, locale }: CustomPostBlockProps) {
  const { post } = content;
  const [isExpanded, setIsExpanded] = useState(false);
  const captionId = useId();
  // The post links to our own landing page; build the href from the route
  // constant + locale instead of the literal URL shown in the caption.
  const landingHref = `/${locale}${SITE_ROUTES.LANDING_PAGE_SERVICE}`;
  const [captionBefore, captionAfter] = post.caption.split("{{link}}");

  return (
    <aside className={styles.block}>
      <span className={styles.badge}>
        <span aria-hidden="true" className={styles.badgeIcon}>
          ⚡
        </span>
        {content.badge}
      </span>

      <h4 className={styles.headline}>{content.headline}</h4>

      {/* Real post produced by the internal workflow */}
      <article className={styles.post}>
        <header className={styles.author}>
          <Image
            alt={post.authorImageAlt}
            className={styles.authorAvatar}
            height={48}
            src={PROFILE_IMAGE_SRC}
            width={48}
          />
          <span className={styles.authorMeta}>
            <span className={styles.authorName}>{post.authorName}</span>
            <span className={styles.authorRole}>{post.authorRole}</span>
          </span>
        </header>

        <div className={styles.captionWrap}>
          <p
            className={styles.caption}
            data-expanded={isExpanded || undefined}
            id={captionId}
          >
            {captionBefore}
            {captionAfter !== undefined ? (
              <>
                <a
                  className={styles.captionLink}
                  href={landingHref}
                  rel="noopener"
                  target="_blank"
                >
                  {post.linkUrl}
                </a>
                {captionAfter}
              </>
            ) : null}
          </p>
          <button
            aria-controls={captionId}
            aria-expanded={isExpanded}
            className={styles.captionToggle}
            onClick={() => setIsExpanded((current) => !current)}
            type="button"
          >
            {isExpanded ? post.captionLess : post.captionMore}
          </button>
        </div>

        <figure className={styles.postImage}>
          <Image
            alt={post.imageAlt}
            className={styles.postImageEl}
            height={1350}
            // Text-heavy slide: high quality keeps type crisp; optimization
            // still gives WebP + responsive sizes so mobile loads a light
            // variant. Lazy-loaded, below the fold.
            quality={90}
            sizes="(max-width: 960px) 92vw, 460px"
            src={post.imageSrc}
            width={1080}
          />
        </figure>
      </article>

      {/* The single command that produced the post */}
      <p className={styles.command}>
        <span className={styles.commandLabel}>{post.commandLabel}</span>
        <span className={styles.commandText}>{post.command}</span>
      </p>

      <p className={styles.context}>{content.context}</p>
      <p className={styles.prompt}>{content.prompt}</p>

      <a
        aria-label={content.ctaAriaLabel}
        className={styles.cta}
        data-analytics-event="cta_click"
        data-analytics-location="generator_custom_post"
        data-analytics-target="contact"
        href={content.ctaHref}
      >
        {content.ctaLabel}
        <span aria-hidden="true" className={styles.arrow}>
          →
        </span>
      </a>
    </aside>
  );
}
