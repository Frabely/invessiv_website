"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import styles from "./legal-document-content.module.css";

type LegalDocumentSection = {
  body: ReactNode;
  id: string;
  title: string;
};

type LegalDocumentContentProps = {
  copySectionLinkLabel: string;
  sectionLinkCopiedLabel: string;
  sections: LegalDocumentSection[];
  tocLabel: string;
};

export function LegalDocumentContent({
  copySectionLinkLabel,
  sectionLinkCopiedLabel,
  sections,
  tocLabel,
}: LegalDocumentContentProps) {
  const [copiedSectionId, setCopiedSectionId] = useState<string>("");
  const [desktopTocTop, setDesktopTocTop] = useState<number>(108);
  const [desktopTocMode, setDesktopTocMode] = useState<
    "static" | "fixed" | "bottom"
  >("static");
  const [mobileTocMode, setMobileTocMode] = useState<"static" | "fixed">(
    "static",
  );
  const [isMobileTocQuiet, setIsMobileTocQuiet] = useState<boolean>(false);
  const [isMobileTocOpen, setIsMobileTocOpen] = useState<boolean>(false);
  const [desktopTocMetrics, setDesktopTocMetrics] = useState({
    bottomTop: 0,
    left: 0,
    maxHeight: 0,
    width: 0,
  });
  const tocColumnRef = useRef<HTMLElement | null>(null);
  const mobileTocAnchorRef = useRef<HTMLDivElement | null>(null);
  const desktopTocRef = useRef<HTMLElement | null>(null);
  const articleRef = useRef<HTMLElement | null>(null);
  const lastMobileScrollYRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const headerInner = document.querySelector<HTMLElement>(
      ".site-header__inner",
    );
    const header = document.querySelector<HTMLElement>(".site-header");
    const observedHeader = headerInner ?? header;

    if (!observedHeader) {
      return;
    }

    const updateDesktopTocTop = () => {
      const nextTop = Math.ceil(
        observedHeader.getBoundingClientRect().height + 12,
      );
      setDesktopTocTop(nextTop);
    };

    updateDesktopTocTop();
    const hasResizeObserver = typeof ResizeObserver !== "undefined";
    const resizeObserver = hasResizeObserver
      ? new ResizeObserver(updateDesktopTocTop)
      : null;
    if (resizeObserver) {
      resizeObserver.observe(observedHeader);
    }
    window.addEventListener("resize", updateDesktopTocTop);

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener("resize", updateDesktopTocTop);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let frameId = 0;

    const updateDesktopTocPosition = () => {
      frameId = 0;
      const tocColumn = tocColumnRef.current;
      const desktopToc = desktopTocRef.current;
      const article = articleRef.current;
      if (!tocColumn || !desktopToc || !article) {
        return;
      }

      if (window.innerWidth < 901) {
        setDesktopTocMode("static");
        return;
      }

      const columnRect = tocColumn.getBoundingClientRect();
      const articleRect = article.getBoundingClientRect();
      const scrollY = window.scrollY;
      const columnTop = columnRect.top + scrollY;
      const articleBottom = articleRect.bottom + scrollY;
      const maxHeight = Math.max(
        220,
        Math.floor(window.innerHeight - desktopTocTop - 12),
      );
      const tocHeight = Math.min(desktopToc.offsetHeight, maxHeight);
      const maxFixedTopDocumentY = articleBottom - tocHeight - 12;
      const fixedTopDocumentY = scrollY + desktopTocTop;

      const nextMetrics = {
        bottomTop: Math.max(0, Math.floor(maxFixedTopDocumentY - columnTop)),
        left: Math.floor(columnRect.left),
        maxHeight,
        width: Math.floor(columnRect.width),
      };

      setDesktopTocMetrics((current) => {
        if (
          current.bottomTop === nextMetrics.bottomTop &&
          current.left === nextMetrics.left &&
          current.maxHeight === nextMetrics.maxHeight &&
          current.width === nextMetrics.width
        ) {
          return current;
        }
        return nextMetrics;
      });

      if (fixedTopDocumentY <= columnTop) {
        setDesktopTocMode("static");
        return;
      }
      if (fixedTopDocumentY >= maxFixedTopDocumentY) {
        setDesktopTocMode("bottom");
        return;
      }
      setDesktopTocMode("fixed");
    };

    const scheduleUpdateDesktopTocPosition = () => {
      if (frameId !== 0) {
        return;
      }
      frameId = window.requestAnimationFrame(updateDesktopTocPosition);
    };

    scheduleUpdateDesktopTocPosition();
    window.addEventListener("scroll", scheduleUpdateDesktopTocPosition, {
      passive: true,
    });
    window.addEventListener("resize", scheduleUpdateDesktopTocPosition);
    const hasResizeObserver = typeof ResizeObserver !== "undefined";
    const resizeObserver = hasResizeObserver
      ? new ResizeObserver(scheduleUpdateDesktopTocPosition)
      : null;
    if (resizeObserver && tocColumnRef.current) {
      resizeObserver.observe(tocColumnRef.current);
    }
    if (resizeObserver && desktopTocRef.current) {
      resizeObserver.observe(desktopTocRef.current);
    }
    if (resizeObserver && articleRef.current) {
      resizeObserver.observe(articleRef.current);
    }

    return () => {
      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener("scroll", scheduleUpdateDesktopTocPosition);
      window.removeEventListener("resize", scheduleUpdateDesktopTocPosition);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [desktopTocTop]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mobileBreakpoint = 900;
    const scrollDeltaThreshold = 8;
    const topResetThreshold = 56;

    const updateMobileTocQuietMode = () => {
      if (window.innerWidth > mobileBreakpoint) {
        setIsMobileTocQuiet(false);
        return;
      }

      const currentScrollY = window.scrollY;
      const previousScrollY = lastMobileScrollYRef.current;

      if (isMobileTocOpen || currentScrollY <= topResetThreshold) {
        setIsMobileTocQuiet(false);
      } else if (currentScrollY > previousScrollY + scrollDeltaThreshold) {
        setIsMobileTocQuiet(true);
      } else if (currentScrollY < previousScrollY - scrollDeltaThreshold) {
        setIsMobileTocQuiet(false);
      }

      lastMobileScrollYRef.current = currentScrollY;
    };

    updateMobileTocQuietMode();
    window.addEventListener("scroll", updateMobileTocQuietMode, {
      passive: true,
    });
    window.addEventListener("resize", updateMobileTocQuietMode);

    return () => {
      window.removeEventListener("scroll", updateMobileTocQuietMode);
      window.removeEventListener("resize", updateMobileTocQuietMode);
    };
  }, [isMobileTocOpen]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mobileBreakpoint = 900;

    const updateMobileTocMode = () => {
      const tocColumn = tocColumnRef.current;
      const mobileAnchor = mobileTocAnchorRef.current;
      if (!tocColumn || !mobileAnchor) {
        return;
      }
      const tocColumnRect = tocColumn.getBoundingClientRect();
      setDesktopTocMetrics((current) => {
        const nextLeft = Math.floor(tocColumnRect.left);
        const nextWidth = Math.floor(tocColumnRect.width);
        if (current.left === nextLeft && current.width === nextWidth) {
          return current;
        }
        return {
          ...current,
          left: nextLeft,
          width: nextWidth,
        };
      });

      if (window.innerWidth > mobileBreakpoint) {
        setMobileTocMode("static");
        return;
      }

      const anchorTopInDocument =
        mobileAnchor.getBoundingClientRect().top + window.scrollY;
      const shouldFix =
        window.scrollY + desktopTocTop + 6 >= anchorTopInDocument;
      setMobileTocMode(shouldFix ? "fixed" : "static");
    };

    updateMobileTocMode();
    window.addEventListener("scroll", updateMobileTocMode, { passive: true });
    window.addEventListener("resize", updateMobileTocMode);

    return () => {
      window.removeEventListener("scroll", updateMobileTocMode);
      window.removeEventListener("resize", updateMobileTocMode);
    };
  }, [desktopTocTop]);

  const desktopTocStyle = {
    "--desktop-toc-bottom-top": `${desktopTocMetrics.bottomTop}px`,
    "--desktop-toc-left": `${desktopTocMetrics.left}px`,
    "--desktop-toc-max-height": `${desktopTocMetrics.maxHeight}px`,
    "--desktop-toc-top": `${desktopTocTop}px`,
    "--desktop-toc-width": `${desktopTocMetrics.width}px`,
  } as CSSProperties;
  const mobileTocStyle = {
    "--mobile-toc-left": `${desktopTocMetrics.left}px`,
    "--mobile-toc-top": `${desktopTocTop}px`,
    "--mobile-toc-width": `${desktopTocMetrics.width}px`,
  } as CSSProperties;

  const desktopTocClassName =
    desktopTocMode === "fixed"
      ? `${styles.desktopToc} ${styles.desktopTocFixed}`
      : desktopTocMode === "bottom"
        ? `${styles.desktopToc} ${styles.desktopTocBottom}`
        : styles.desktopToc;
  const mobileTocClassName =
    mobileTocMode === "fixed"
      ? isMobileTocQuiet && !isMobileTocOpen
        ? `${styles.mobileToc} ${styles.mobileTocFixed} ${styles.mobileTocQuiet}`
        : `${styles.mobileToc} ${styles.mobileTocFixed}`
      : isMobileTocQuiet && !isMobileTocOpen
        ? `${styles.mobileToc} ${styles.mobileTocQuiet}`
        : styles.mobileToc;

  const smoothScrollToSection = useCallback(
    (sectionId: string, updateHash: boolean) => {
      if (typeof window === "undefined") {
        return;
      }

      const target = document.getElementById(sectionId);
      if (!target) {
        return;
      }

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      target.focus({ preventScroll: true });
      target.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });

      if (updateHash) {
        window.history.replaceState(null, "", `#${sectionId}`);
      }
    },
    [],
  );

  const handleTocClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
      event.preventDefault();
      smoothScrollToSection(sectionId, true);
      const mobileDetails = event.currentTarget.closest("details");
      if (mobileDetails) {
        mobileDetails.removeAttribute("open");
        setIsMobileTocOpen(false);
      }
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
      <aside className={styles.tocColumn} ref={tocColumnRef}>
        <div aria-hidden="true" ref={mobileTocAnchorRef} />
        <details
          className={mobileTocClassName}
          onToggle={(event) => setIsMobileTocOpen(event.currentTarget.open)}
          style={mobileTocStyle}
        >
          <summary>{tocLabel}</summary>
          <nav aria-label={tocLabel} className={styles.tocNav}>
            <ol className={styles.tocList}>
              {sections.map((section) => (
                <li key={`mobile-${section.id}`}>
                  <a
                    className={styles.tocLink}
                    href={`#${section.id}`}
                    onClick={(event) => handleTocClick(event, section.id)}
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </details>

        <nav
          aria-label={tocLabel}
          className={desktopTocClassName}
          ref={desktopTocRef}
          style={desktopTocStyle}
        >
          <h2>{tocLabel}</h2>
          <ol className={styles.tocList}>
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  className={styles.tocLink}
                  href={`#${section.id}`}
                  onClick={(event) => handleTocClick(event, section.id)}
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </aside>

      <article className={styles.article} ref={articleRef}>
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
                    {copiedSectionId === section.id
                      ? sectionLinkCopiedLabel
                      : copySectionLinkLabel}
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
