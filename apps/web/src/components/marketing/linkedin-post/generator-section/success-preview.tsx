import { PrimaryCtaLink } from "@/components/shared/button/button";
import type { LinkedInPostGeneratorContent } from "@/i18n/dictionaries/linkedin-post/generator";
import { LinkedinPost } from "@/components/marketing/linkedin-post/linkedin-post/linkedin-post";
import { PostFramePreview } from "./post-frame-preview/post-frame-preview";
import {
  LeadCaptureCard,
  type LeadIdentity,
} from "./lead-capture-card/lead-capture-card";
import styles from "./success-preview.module.css";

type SuccessPreviewProps = {
  caption: string;
  content: LinkedInPostGeneratorContent;
  hasCopied: boolean;
  downloadFileName: string;
  authorName: string;
  expertiseDisplay: string;
  followUpHref: string;
  imageDataUrl: string | null;
  postTitle: string;
  previewHtml: string;
  onCopyCaption: (caption: string) => void;
  onDownloadCaption: (caption: string, downloadFileName: string) => void;
  onDownloadImage: (imageDataUrl: string, downloadFileName: string) => void;
  onLeadIdentityChange: (identity: LeadIdentity) => void;
  onRequestCustomWorkflow: () => void;
};

export function SuccessPreview({
  caption,
  content,
  hasCopied,
  downloadFileName,
  authorName,
  expertiseDisplay,
  followUpHref,
  imageDataUrl,
  postTitle,
  previewHtml,
  onCopyCaption,
  onDownloadCaption,
  onDownloadImage,
  onLeadIdentityChange,
  onRequestCustomWorkflow,
}: SuccessPreviewProps) {
  const resolvedAuthorName =
    authorName || content.preview.success.fallbackAuthorName;
  const avatarInitial = resolvedAuthorName
    .split(/\s+/u)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);
  const { success } = content.preview;

  /** Both gated actions ship the post with its caption (image + caption text). */
  function handleLeadDownload() {
    if (imageDataUrl) {
      onDownloadImage(imageDataUrl, downloadFileName);
    }
    onDownloadCaption(caption, downloadFileName);
  }

  return (
    <div className={styles.preview} data-state="success">
      <div className={styles.head}>
        <h3 className={styles.headline}>{success.headline}</h3>
        <button
          className={styles.copyButton}
          data-state={hasCopied ? "copied" : "default"}
          onClick={() => onCopyCaption(caption)}
          type="button"
        >
          {hasCopied ? success.copyCaptionCopied : success.copyCaption}
        </button>
      </div>

      <LinkedinPost
        author={{
          avatar: { kind: "initials", value: avatarInitial },
          name: resolvedAuthorName,
          role: expertiseDisplay,
        }}
        caption={caption}
        image={
          <figure aria-label={postTitle} className={styles.postImage}>
            <PostFramePreview html={previewHtml} title={postTitle} />
          </figure>
        }
      />

      <LeadCaptureCard
        content={content.leadCapture}
        onDownload={handleLeadDownload}
        onIdentityChange={onLeadIdentityChange}
      />

      <div className={styles.followUpCard}>
        <p className={styles.followUpBadge}>{success.followUp.badge}</p>
        <h3 className={styles.followUpHeadline}>{success.followUp.headline}</h3>
        <p className={styles.followUpBody}>{success.followUp.body}</p>
        <PrimaryCtaLink
          aria-label={success.followUp.ctaAriaLabel}
          className={styles.followUpCta}
          href={followUpHref}
          onClick={onRequestCustomWorkflow}
        >
          {success.followUp.ctaLabel}
        </PrimaryCtaLink>
      </div>
    </div>
  );
}
