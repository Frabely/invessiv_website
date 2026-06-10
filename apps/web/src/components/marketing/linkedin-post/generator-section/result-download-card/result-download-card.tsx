import {
  ButtonControl,
  PrimaryCtaButton,
} from "@/components/shared/button/button";
import { linkedinPostZipDownloadService } from "@/client/linkedin-post/services/linkedin-post-zip-download-service";
import type { LinkedInPostGeneratorResultDownloadCopy } from "@/i18n/dictionaries/linkedin-post/generator";
import styles from "./result-download-card.module.css";

type ResultDownloadCardProps = {
  caption: string;
  content: LinkedInPostGeneratorResultDownloadCopy;
  downloadFileName: string;
  imageDataUrl: string | null;
  onDownload: () => void;
  onRequestNewPost: () => void;
};

export function ResultDownloadCard({
  caption,
  content,
  downloadFileName,
  imageDataUrl,
  onDownload,
  onRequestNewPost,
}: ResultDownloadCardProps) {
  function handleDownload() {
    if (!imageDataUrl) {
      return;
    }
    linkedinPostZipDownloadService.downloadLinkedInPostZip({
      caption,
      downloadFileName,
      imageDataUrl,
    });
    onDownload();
  }

  return (
    <section
      className={styles.card}
      aria-labelledby="linkedin-post-download-title"
    >
      <header className={styles.head}>
        <h3 className={styles.headline} id="linkedin-post-download-title">
          {content.headline}
        </h3>
        <p className={styles.body}>{content.body}</p>
      </header>

      {!imageDataUrl ? (
        <p className={styles.feedback} role="status">
          {content.downloadUnavailable}
        </p>
      ) : null}

      <div className={styles.actions}>
        <PrimaryCtaButton
          className={styles.downloadAction}
          disabled={!imageDataUrl}
          onClick={handleDownload}
          type="button"
        >
          {content.downloadAction}
        </PrimaryCtaButton>
        <ButtonControl
          className={styles.secondaryAction}
          onClick={onRequestNewPost}
          type="button"
          variant="ghost"
        >
          {content.newPostAction}
        </ButtonControl>
      </div>
    </section>
  );
}
