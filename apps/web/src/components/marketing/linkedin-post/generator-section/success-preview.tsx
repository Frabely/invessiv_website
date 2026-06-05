import { PrimaryCtaLink } from "@/components/shared/button/button";
import type { Locale } from "@/config/i18n";
import type { LinkedInPostGeneratorContent } from "@/i18n/dictionaries/linkedin-post/generator";
import { LinkedinPost } from "@/components/marketing/linkedin-post/linkedin-post/linkedin-post";
import { PostFramePreview } from "./post-frame-preview/post-frame-preview";
import type { LeadIdentity } from "@/common/contracts/generator/lead-identity";
import { LeadCaptureCard } from "./lead-capture-card/lead-capture-card";
import styles from "./success-preview.module.css";

type SuccessPreviewProps = {
  caption: string;
  content: LinkedInPostGeneratorContent;
  hasCopied: boolean;
  authorName: string;
  expertiseDisplay: string;
  followUpHref: string;
  locale: Locale;
  postTitle: string;
  previewHtml: string;
  deliveryToken?: string;
  onCopyCaption: (caption: string) => void;
  onLeadIdentityChange: (identity: LeadIdentity) => void;
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
  locale,
  postTitle,
  previewHtml,
  deliveryToken,
  onCopyCaption,
  onLeadIdentityChange,
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

  return (
    <div className={styles.preview} data-state="success">
      <LinkedinPost
        author={{
          avatar: { kind: "initials", value: avatarInitial },
          name: resolvedAuthorName,
          role: expertiseDisplay,
        }}
        caption={caption}
        headerAction={
          <button
            className={styles.copyButton}
            data-state={hasCopied ? "copied" : "default"}
            onClick={() => onCopyCaption(caption)}
            type="button"
          >
            {hasCopied ? success.copyCaptionCopied : success.copyCaption}
          </button>
        }
        image={
          <figure aria-label={postTitle} className={styles.postImage}>
            <PostFramePreview html={previewHtml} title={postTitle} />
          </figure>
        }
      />

      <LeadCaptureCard
        content={content.leadCapture}
        deliveryToken={deliveryToken}
        locale={locale}
        onIdentityChange={onLeadIdentityChange}
        onRequestNewPost={onRequestNewPost}
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
