"use client";

import { useEffect, useRef, useState } from "react";
import { useProofPreviewMode } from "@/hooks/marketing/use-proof-preview-mode";
import styles from "./proof-preview-experience.module.css";

type ProofPreviewOption = {
  badge?: string;
  description: string;
  frameLabel: string;
  key: string;
  label: string;
  viewport: "app" | "desktop";
};

type ProofPreviewExperienceProps = {
  desktopModeKey: string;
  embedUrl: string;
  hint: string;
  iframeTitle: string;
  mobileModeKey: string;
  openLabel: string;
  options: ProofPreviewOption[];
  projectHref: string;
  projectKicker: string;
  projectLinkLabel: string;
  projectTitle: string;
  prompt: string;
};

export function ProofPreviewExperience({
  desktopModeKey,
  embedUrl,
  hint,
  iframeTitle,
  mobileModeKey,
  openLabel,
  options,
  projectHref,
  projectKicker,
  projectLinkLabel,
  projectTitle,
  prompt,
}: ProofPreviewExperienceProps) {
  const { selectMode, selectedModeKey } = useProofPreviewMode({
    desktopModeKey,
    mobileModeKey,
  });

  const activeOption =
    options.find((option) => option.key === selectedModeKey) ?? options[0];
  const frameViewportRef = useRef<HTMLDivElement | null>(null);
  const [frameViewportWidth, setFrameViewportWidth] = useState(0);
  const frameClassName =
    activeOption.viewport === "app"
      ? `${styles.frameOuter} ${styles.frameApp}`
      : `${styles.frameOuter} ${styles.frameDesktop}`;
  const iframeClassName =
    activeOption.viewport === "app"
      ? `${styles.iframe} ${styles.iframeApp}`
      : `${styles.iframe} ${styles.iframeDesktop}`;
  const canvasWidth = activeOption.viewport === "app" ? 430 : 1440;
  const canvasHeight = activeOption.viewport === "app" ? 932 : 960;
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
  }, [activeOption.viewport]);

  return (
    <div className={styles.shell}>
      <div className={styles.selection}>
        <p className={styles.prompt}>{prompt}</p>
        <p className={styles.hint}>{hint}</p>
        <div aria-label={prompt} className={styles.options} role="radiogroup">
          {options.map((option) => {
            const isActive = option.key === activeOption.key;

            return (
              <button
                aria-checked={isActive}
                className={`${styles.option}${isActive ? ` ${styles.optionActive}` : ""}`}
                key={option.key}
                onClick={() => {
                  selectMode(option.key);
                }}
                role="radio"
                type="button"
              >
                <span className={styles.optionHeader}>
                  <span className={styles.optionLabel}>{option.label}</span>
                  {option.badge ? (
                    <span className={styles.badge}>{option.badge}</span>
                  ) : null}
                </span>
                <span className={styles.optionDescription}>
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.stage}>
        <div className={styles.stageHeader}>
          <p className={styles.frameLabel}>{activeOption.frameLabel}</p>
          <a
            className={styles.openLink}
            href={embedUrl}
            rel="noreferrer"
            target="_blank"
          >
            {openLabel}
          </a>
        </div>

        <div className={frameClassName}>
          {activeOption.viewport === "app" ? (
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
      </div>
    </div>
  );
}
