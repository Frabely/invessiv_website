import { PrimaryCtaLink, SecondaryCtaButton } from "@invessiv/ui";
import { AnalyticsCtaId } from "@/common/constants/analytics/analytics-cta-id";
import { AnalyticsEventName } from "@/common/constants/analytics/analytics-event-name";
import { AnalyticsTarget } from "@/common/constants/analytics/analytics-target";
import { analyticsAttributes } from "@/common/patterns/analytics/analytics-properties";
import type { LinkedInPostGeneratorContent } from "@/i18n/dictionaries/linkedin-post/generator";
import { LinkedinPost } from "@/components/marketing/linkedin-post/linkedin-post/linkedin-post";
import {
  LinkedinPostCaptionClamp,
  LinkedinPostCaptionFit,
} from "@/common/constants";
import { PostFramePreview } from "./post-frame-preview/post-frame-preview";
import { ResultDownloadCard } from "./result-download-card/result-download-card";
import styles from "./success-preview.module.css";

type SuccessPreviewProps = {
  caption: string;
  content: LinkedInPostGeneratorContent;
  hasCopied: boolean;
  authorName: string;
  expertiseDisplay: string;
  followUpHref: string;
  postTitle: string;
  previewHtml: string;
  imageDataUrl: string;
  onCopyCaption: (caption: string) => void;
  onDownloadPost: () => void;
  onRequestNewPost: () => void;
  onRequestCustomWorkflow: () => void;
};

export function SuccessPreview({
  caption,
  content,
  hasCopied,
  authorName,
  expertiseDisplay,
  followUpHref,
  postTitle,
  previewHtml,
  imageDataUrl,
  onCopyCaption,
  onDownloadPost,
  onRequestNewPost,
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
  const downloadResourceFileName = `${content.resultDownload.fileBaseName}.png`;

  return (
    <div className={styles.preview} data-state="success">
      <div className={styles.postPane} data-slot="success-post">
        <LinkedinPost
          author={{
            avatar: { kind: "initials", value: avatarInitial },
            name: resolvedAuthorName,
            role: expertiseDisplay,
          }}
          caption={caption}
          captionClamp={LinkedinPostCaptionClamp.Result}
          captionFit={LinkedinPostCaptionFit.LineClamp}
          captionLess={success.captionLess}
          captionMore={success.captionMore}
          className={styles.postCard}
          headerAction={
            <SecondaryCtaButton
              className={styles.copyButton}
              aria-live="polite"
              onClick={() => onCopyCaption(caption)}
              size="control"
              type="button"
            >
              {hasCopied ? success.copyCaptionCopied : success.copyCaption}
            </SecondaryCtaButton>
          }
          image={
            <figure aria-label={postTitle} className={styles.postImage}>
              <PostFramePreview html={previewHtml} title={postTitle} />
            </figure>
          }
        />
      </div>

      <div className={styles.actionRail} data-slot="success-actions">
        <ResultDownloadCard
          caption={caption}
          content={content.resultDownload}
          downloadFileName={downloadResourceFileName}
          imageDataUrl={imageDataUrl}
          onDownload={onDownloadPost}
          onRequestNewPost={onRequestNewPost}
        />

        <div className={styles.followUpCard}>
          <p className={styles.followUpBadge}>{success.followUp.badge}</p>
          <h3 className={styles.followUpHeadline}>
            {success.followUp.headline}
          </h3>
          <p className={styles.followUpBody}>{success.followUp.body}</p>
          <PrimaryCtaLink
            aria-label={success.followUp.ctaAriaLabel}
            className={styles.followUpCta}
            href={followUpHref}
            onClick={onRequestCustomWorkflow}
            {...analyticsAttributes(AnalyticsEventName.CtaClicked, {
              cta: AnalyticsCtaId.LinkedInResultContact,
              target: AnalyticsTarget.ContactForm,
            })}
          >
            {success.followUp.ctaLabel}
          </PrimaryCtaLink>
        </div>
      </div>
    </div>
  );
}
