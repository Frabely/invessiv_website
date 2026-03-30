"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./proof-preview-experience.module.css";

type ProofPreviewExperienceProps = {
  embedUrl: string;
  frameLabel: string;
  hint: string;
  iframeTitle: string;
  openLabel: string;
  projectHref: string;
  projectKicker: string;
  projectLinkLabel: string;
  projectTitle: string;
  compact?: boolean;
  viewport: "app" | "desktop";
};

export function ProofPreviewExperience({
  embedUrl,
  frameLabel,
  hint,
  iframeTitle,
  openLabel,
  projectHref,
  projectKicker,
  projectLinkLabel,
  projectTitle,
  compact = false,
  viewport,
}: ProofPreviewExperienceProps) {
  const frameViewportRef = useRef<HTMLDivElement | null>(null);
  const [frameViewportWidth, setFrameViewportWidth] = useState(0);
  const shellClassName =
    viewport === "app"
      ? `${styles.shell} ${styles.shellApp}`
      : compact
        ? `${styles.shell} ${styles.shellCompact}`
        : styles.shell;
  const frameClassName =
    viewport === "app"
      ? `${styles.frameOuter} ${styles.frameApp}`
      : `${styles.frameOuter} ${styles.frameDesktop}`;
  const iframeClassName =
    viewport === "app"
      ? `${styles.iframe} ${styles.iframeApp}`
      : `${styles.iframe} ${styles.iframeDesktop}`;
  const canvasWidth = viewport === "app" ? 430 : 1440;
  const canvasHeight = viewport === "app" ? 932 : 960;
  const previewScale =
    frameViewportWidth > 0 ? Math.min(1, frameViewportWidth / canvasWidth) : 1;
  const previewHeight = canvasHeight * previewScale;

  useEffect(() => {
    const element = frameViewportRef.current;

    if (!element) {
      return;
    }

    const updateWidth = () => {
      setFrameViewportWidth(element.clientWidth);
    };

    updateWidth();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateWidth);

      return () => {
        window.removeEventListener("resize", updateWidth);
      };
    }

    const observer = new ResizeObserver(() => {
      updateWidth();
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [viewport]);

  return (
    <div className={shellClassName}>
      {viewport === "desktop" && !compact ? (
        <p className={styles.hint}>{hint}</p>
      ) : null}

      <div className={styles.stage}>
        {viewport === "desktop" && !compact ? (
          <div className={styles.stageHeader}>
            <p className={styles.frameLabel}>{frameLabel}</p>
            <a
              className={styles.openLink}
              href={embedUrl}
              rel="noreferrer"
              target="_blank"
            >
              {openLabel}
            </a>
          </div>
        ) : null}

        <div className={frameClassName}>
          {viewport === "app" ? (
            <div aria-hidden="true" className={styles.appChrome}>
              <span />
            </div>
          ) : (
            <div aria-hidden="true" className={styles.browserChrome}>
              <span />
              <span />
              <span />
            </div>
          )}
          <div
            className={styles.frameViewport}
            ref={frameViewportRef}
            style={{ height: `${previewHeight}px` }}
          >
            <iframe
              className={iframeClassName}
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              sandbox="allow-forms allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
              src={embedUrl}
              style={{
                height: `${canvasHeight}px`,
                transform: `scale(${previewScale})`,
                width: `${canvasWidth}px`,
              }}
              title={iframeTitle}
            />
          </div>
        </div>

        {!compact || viewport === "desktop" ? (
          <div className={styles.projectMeta}>
            <div className={styles.projectCopy}>
              <p className={styles.projectKicker}>{projectKicker}</p>
              <p className={styles.projectTitle}>{projectTitle}</p>
            </div>
            <a
              className={styles.projectLink}
              href={projectHref}
              rel="noreferrer"
              target="_blank"
            >
              {projectLinkLabel}
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
}
