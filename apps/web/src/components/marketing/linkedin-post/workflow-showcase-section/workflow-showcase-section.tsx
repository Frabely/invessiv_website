"use client";

import Image from "next/image";
import { useRef } from "react";
import { EyebrowPill } from "@/components/shared/eyebrow-pill/eyebrow-pill";
import { PrimaryCtaLink } from "@/components/shared/button/button";
import { LinkedinPost } from "@/components/marketing/linkedin-post/linkedin-post/linkedin-post";
import type { Locale } from "@/config/i18n";
import { SITE_ROUTES } from "@/config/routes";
import { useStaggeredSectionReveal } from "@/hooks/marketing/use-staggered-section-reveal";
import type { LinkedInPostGeneratorCustomPostCopy } from "@/i18n/dictionaries/linkedin-post/generator";
import styles from "./workflow-showcase-section.module.css";

const PROFILE_IMAGE_SRC = "/linkedin-post/moritz-hecht.jpeg";

type WorkflowShowcaseSectionProps = LinkedInPostGeneratorCustomPostCopy & {
  id: string;
  locale: Locale;
};

export function WorkflowShowcaseSection({
  id,
  locale,
  badge,
  headline,
  context,
  prompt,
  ctaLabel,
  ctaAriaLabel,
  ctaHref,
  post,
}: WorkflowShowcaseSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  useStaggeredSectionReveal(sectionRef, locale);

  const landingHref = `/${locale}${SITE_ROUTES.LANDING_PAGE_SERVICE}`;
  const [captionBefore, captionAfter] = post.caption.split("{{link}}");
  const captionNode = (
    <>
      {captionBefore}
      {captionAfter !== undefined ? (
        <>
          <a href={landingHref} rel="noopener" target="_blank">
            {post.linkUrl}
          </a>
          {captionAfter}
        </>
      ) : null}
    </>
  );

  return (
    <section className={styles.section} id={id} ref={sectionRef}>
      <div className={styles.grid}>
        <div className={styles.pitch} data-reveal-item="true">
          <EyebrowPill>{badge}</EyebrowPill>
          <h2 className={styles.headline}>{headline}</h2>
          <p className={styles.body}>{context}</p>
          <p className={styles.body}>{prompt}</p>
          <div className={styles.ctaWrap}>
            <PrimaryCtaLink aria-label={ctaAriaLabel} href={ctaHref}>
              {ctaLabel}
            </PrimaryCtaLink>
          </div>
        </div>
        <div className={styles.postColumn} data-reveal-item="true">
          <LinkedinPost
            author={{
              avatar: {
                alt: post.authorImageAlt,
                kind: "image",
                src: PROFILE_IMAGE_SRC,
              },
              name: post.authorName,
              role: post.authorRole,
            }}
            caption={captionNode}
            captionLess={post.captionLess}
            captionMore={post.captionMore}
            image={
              <figure aria-hidden="true" className={styles.postImage}>
                <Image
                  alt={post.imageAlt}
                  fill
                  quality={90}
                  sizes="(max-width: 720px) 92vw, (max-width: 960px) 46vw, 460px"
                  src={post.imageSrc}
                  style={{ objectFit: "cover" }}
                />
              </figure>
            }
          />

          <p className={styles.command}>
            <span className={styles.commandLabel}>{post.commandLabel}</span>
            <span className={styles.commandText}>{post.command}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
