import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  GENERATOR_FORM_ID,
  GeneratorAnalyticsEvent,
  PostDownloadTarget,
} from "@/common/constants/generator/generator-analytics";
import type { Locale } from "@/config/i18n";
import type { LinkedInPostGeneratorContent } from "@/i18n/dictionaries/linkedin-post/generator";
import { CustomPostBlock } from "./custom-post-block/custom-post-block";
import styles from "./generator-section.module.css";

type SuccessPreviewProps = {
  caption: string;
  content: LinkedInPostGeneratorContent;
  downloadToken: string;
  imageUrl: string;
  locale: Locale;
};

export function SuccessPreview({
  caption,
  content,
  downloadToken,
  imageUrl,
  locale,
}: SuccessPreviewProps) {
  const { success } = content.preview;
  const [hasCopied, setHasCopied] = useState(false);
  const copyResetTimeout = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyResetTimeout.current) {
        window.clearTimeout(copyResetTimeout.current);
      }
    };
  }, []);

  function handleCopy() {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }
    navigator.clipboard.writeText(caption).then(() => {
      setHasCopied(true);
      if (copyResetTimeout.current) {
        window.clearTimeout(copyResetTimeout.current);
      }
      copyResetTimeout.current = window.setTimeout(
        () => setHasCopied(false),
        2200,
      );
    });
  }

  function handleAnalyticsDownload(target: PostDownloadTarget) {
    if (typeof window === "undefined") {
      return;
    }
    window.dispatchEvent(
      new CustomEvent(GeneratorAnalyticsEvent.PostDownload, {
        detail: {
          form_id: GENERATOR_FORM_ID,
          target,
        },
      }),
    );
  }

  const captionTextHref = `data:text/plain;charset=utf-8,${encodeURIComponent(caption)}`;

  return (
    <div className={styles.preview} data-state="success">
      <div className={styles.previewFrame}>
        <div className={styles.successMedia}>
          <Image
            alt={success.imageAlt}
            className={styles.successImage}
            fill
            sizes="(max-width: 720px) 100vw, 480px"
            src={imageUrl}
            unoptimized
          />
        </div>
        <div className={styles.previewBody}>
          <p className={styles.previewMark} aria-hidden="true">
            ⌗ READY
          </p>
          <h3 className={styles.previewHeadline}>{success.headline}</h3>
          <div className={styles.captionBlock}>
            <p className={styles.captionLabel}>{success.captionLabel}</p>
            <p className={styles.captionText}>{caption}</p>
            <button
              className={styles.copyButton}
              data-state={hasCopied ? "copied" : "default"}
              onClick={handleCopy}
              type="button"
            >
              {hasCopied ? success.copyCaptionCopied : success.copyCaption}
            </button>
          </div>
          <div className={styles.downloadRow}>
            <a
              className={styles.downloadButton}
              data-analytics-event={GeneratorAnalyticsEvent.PostDownload}
              data-analytics-target={PostDownloadTarget.Image}
              download
              href={imageUrl}
              onClick={() => handleAnalyticsDownload(PostDownloadTarget.Image)}
            >
              {success.downloadImage}
            </a>
            <a
              className={styles.downloadButton}
              data-analytics-event={GeneratorAnalyticsEvent.PostDownload}
              data-analytics-target={PostDownloadTarget.Text}
              download={`linkedin-post-${downloadToken}.txt`}
              href={captionTextHref}
              onClick={() => handleAnalyticsDownload(PostDownloadTarget.Text)}
            >
              {success.downloadCaption}
            </a>
          </div>
        </div>
      </div>

      <CustomPostBlock content={content.customPost} locale={locale} />
    </div>
  );
}
