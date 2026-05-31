import type { LinkedInPostGeneratorContent } from "@/i18n/dictionaries/linkedin-post/generator";
import { LinkedinPost } from "@/components/marketing/linkedin-post/linkedin-post/linkedin-post";
import { PostFramePreview } from "./post-frame-preview/post-frame-preview";
import styles from "./success-preview.module.css";

type SuccessPreviewProps = {
  caption: string;
  content: LinkedInPostGeneratorContent;
  hasCopied: boolean;
  downloadFileName: string;
  authorName: string;
  expertiseDisplay: string;
  imageDataUrl: string | null;
  postTitle: string;
  previewHtml: string;
  onCopyCaption: (caption: string) => void;
  onDownloadCaption: (caption: string, downloadFileName: string) => void;
  onDownloadImage: (imageDataUrl: string, downloadFileName: string) => void;
};

export function SuccessPreview({
  caption,
  content,
  hasCopied,
  downloadFileName,
  authorName,
  expertiseDisplay,
  imageDataUrl,
  postTitle,
  previewHtml,
  onCopyCaption,
  onDownloadCaption,
  onDownloadImage,
}: SuccessPreviewProps) {
  const avatarInitial = authorName
    .split(/\s+/u)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);
  const { success } = content.preview;

  return (
    <div className={styles.preview} data-state="success">
      <div className={styles.mobileActions}>
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
          name: authorName,
          role: expertiseDisplay,
        }}
        caption={caption}
        image={
          <figure aria-label={postTitle} className={styles.postImage}>
            <PostFramePreview html={previewHtml} title={postTitle} />
          </figure>
        }
      />

      <div className={styles.mobileActions}>
        <div className={styles.downloadRow}>
          <button
            className={styles.downloadButton}
            disabled={!imageDataUrl}
            onClick={() => {
              if (!imageDataUrl) {
                return;
              }
              onDownloadImage(imageDataUrl, downloadFileName);
            }}
            type="button"
          >
            {success.downloadImage}
          </button>
          <button
            className={styles.downloadButton}
            onClick={() => onDownloadCaption(caption, downloadFileName)}
            type="button"
          >
            {success.downloadCaption}
          </button>
        </div>
      </div>
    </div>
  );
}
