"use client";

import Image from "next/image";
import { useRef } from "react";

import { EyebrowPill } from "@/components/shared/eyebrow-pill/eyebrow-pill";
import type { Locale } from "@/config/i18n";
import { useStaggeredSectionReveal } from "@/hooks/marketing/use-staggered-section-reveal";
import type { LandingTrustContent } from "@/i18n/dictionaries/landing/trust";
import styles from "./trust-section.module.css";

type TrustSectionProps = LandingTrustContent & {
  id: string;
  locale: Locale;
  replyAnalyticsTarget: string;
  replyHref: string;
};

function renderHighlightedTitle(title: string, highlight: string) {
  const highlightStart = title.indexOf(highlight);

  if (highlightStart < 0) {
    return title;
  }

  const beforeHighlight = title.slice(0, highlightStart);
  const afterHighlight = title.slice(highlightStart + highlight.length);
  const trailingPunctuation = afterHighlight.match(/^\s*([.!?:;]+)/)?.[1] ?? "";
  const continuation = afterHighlight
    .slice(
      afterHighlight.indexOf(trailingPunctuation) + trailingPunctuation.length,
    )
    .trimStart();

  return (
    <>
      {beforeHighlight}
      <span className={styles.titleHighlight}>{highlight}</span>
      {trailingPunctuation}
      {continuation ? (
        <span className={styles.titleContinuation}>{continuation}</span>
      ) : null}
    </>
  );
}

export function TrustSection({
  body,
  chat,
  eyebrow,
  id,
  locale,
  replyAnalyticsTarget,
  replyHref,
  title,
  titleHighlight,
}: TrustSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  useStaggeredSectionReveal(sectionRef, locale, { staggerMs: 110 });

  return (
    <section className={styles.section} id={id} ref={sectionRef}>
      <span aria-hidden="true" className={styles.glow} />

      <div className={styles.layout}>
        <header className={styles.intro} data-reveal-item="true">
          <EyebrowPill className={styles.eyebrow}>{eyebrow}</EyebrowPill>
          <h2 className={styles.title}>
            {renderHighlightedTitle(title, titleHighlight)}
          </h2>
          {body ? <p className={styles.body}>{body}</p> : null}
        </header>

        <article className={styles.chatCard} data-reveal-item="true">
          <div className={styles.chatHeader}>
            <span className={styles.avatarFrame}>
              <Image
                alt={chat.avatarAlt}
                className={styles.avatar}
                height={96}
                src="/assets/moritz-hecht.jpeg"
                width={96}
              />
              <span aria-hidden="true" className={styles.statusDot} />
            </span>
            <span className={styles.identity}>
              <span className={styles.name}>{chat.name}</span>
              <span className={styles.role}>{chat.role}</span>
            </span>
            <span className={styles.status}>{chat.statusLabel}</span>
          </div>

          <ul aria-label={chat.threadLabel} className={styles.thread}>
            {chat.messages.map((message) => (
              <li
                className={styles.message}
                data-reveal-item="true"
                key={message.title}
              >
                <span className={styles.messageTitle}>{message.title}</span>
                <span className={styles.messageBody}>{message.body}</span>
              </li>
            ))}
          </ul>

          <div className={styles.replyBar} data-reveal-item="true">
            <span aria-hidden="true" className={styles.typingIndicator}>
              <span />
              <span />
              <span />
            </span>
            <a
              className={styles.reply}
              data-analytics-event="cta_click"
              data-analytics-location="trust"
              data-analytics-target={replyAnalyticsTarget}
              data-analytics-variant="secondary"
              href={replyHref}
            >
              <span className={styles.replyLabel}>{chat.replyCtaLabel}</span>
              <span aria-hidden="true" className={styles.replySend}>
                <svg
                  fill="none"
                  height="16"
                  viewBox="0 0 24 24"
                  width="16"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 12h14m0 0-5.5-5.5M18 12l-5.5 5.5"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.2"
                  />
                </svg>
              </span>
            </a>
          </div>
        </article>
      </div>
    </section>
  );
}
