"use client";

import { useCallback, useState } from "react";
import type { ReactNode } from "react";
import styles from "./terms-content.module.css";

type TermsSection = {
  body: ReactNode;
  id: string;
  title: string;
};

type TermsContentProps = {
  copySectionLinkLabel: string;
  sectionLinkCopiedLabel: string;
  sections: TermsSection[];
  tocLabel: string;
};

export function TermsContent({
  copySectionLinkLabel,
  sectionLinkCopiedLabel,
  sections,
  tocLabel,
}: TermsContentProps) {
  const [copiedSectionId, setCopiedSectionId] = useState<string>("");

  const smoothScrollToSection = useCallback((sectionId: string, updateHash: boolean) => {
    if (typeof window === "undefined") {
      return;
    }

    const target = document.getElementById(sectionId);
    if (!target) {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.focus({ preventScroll: true });
    target.scrollIntoView({
      behavior: prefersReducedMotion ? "auto" : "smooth",
      block: "start",
    });

    if (updateHash) {
      window.history.replaceState(null, "", `#${sectionId}`);
    }
  }, []);

  const handleTocClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
      event.preventDefault();
      smoothScrollToSection(sectionId, true);
    },
    [smoothScrollToSection],
  );

  const handleCopyLink = useCallback(async (sectionId: string) => {
    if (typeof window === "undefined") {
      return;
    }

    const url = `${window.location.origin}${window.location.pathname}#${sectionId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedSectionId(sectionId);
      window.history.replaceState(null, "", `#${sectionId}`);
      setTimeout(() => {
        setCopiedSectionId((current) => (current === sectionId ? "" : current));
      }, 1800);
    } catch {
      setCopiedSectionId("");
    }
  }, []);

  if (!sections.length) {
    return null;
  }

  return (
    <div className={styles.layout}>
      <aside className={styles.tocColumn}>
        <details className={styles.mobileToc}>
          <summary>{tocLabel}</summary>
          <nav aria-label={tocLabel} className={styles.tocNav}>
            <ol className={styles.tocList}>
              {sections.map((section) => (
                <li key={`mobile-${section.id}`}>
                  <a className={styles.tocLink} href={`#${section.id}`} onClick={(event) => handleTocClick(event, section.id)}>
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </details>

        <nav aria-label={tocLabel} className={styles.desktopToc}>
          <h2>{tocLabel}</h2>
          <ol className={styles.tocList}>
            {sections.map((section) => (
              <li key={section.id}>
                <a className={styles.tocLink} href={`#${section.id}`} onClick={(event) => handleTocClick(event, section.id)}>
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </aside>

      <article className={styles.article}>
        <div className={styles.articleInner}>
          {sections.map((section) => (
            <section
              aria-labelledby={`${section.id}-heading`}
              className={styles.articleSection}
              id={section.id}
              key={section.id}
              tabIndex={-1}
            >
              <div className={styles.sectionHeader}>
                <h2 id={`${section.id}-heading`}>{section.title}</h2>
                <div className={styles.sectionActions}>
                  <button
                    aria-label={`${copySectionLinkLabel}: ${section.title}`}
                    onClick={() => handleCopyLink(section.id)}
                    type="button"
                  >
                    {copiedSectionId === section.id ? sectionLinkCopiedLabel : copySectionLinkLabel}
                  </button>
                </div>
              </div>
              <div className={styles.sectionBody}>{section.body}</div>
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}
