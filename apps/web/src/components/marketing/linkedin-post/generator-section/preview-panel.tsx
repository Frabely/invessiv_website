import { GeneratorStateKind } from "@/common/constants/generator/generator-state-kind";
import { LinkedInPostGeneratorErrorCode } from "@/common/constants/generator";
import type { GeneratorState } from "@/common/contracts/generator/generator-state";
import type { LinkedInPostGeneratorContent } from "@/i18n/dictionaries/linkedin-post/generator";
import { SuccessPreview } from "./success-preview";
import styles from "./preview-panel.module.css";

type PreviewPanelProps = {
  content: LinkedInPostGeneratorContent;
  followUpHref: string;
  hasCopied: boolean;
  onCopyCaption: (caption: string) => void;
  onDownloadCaption: (caption: string, downloadFileName: string) => void;
  onDownloadImage: (imageDataUrl: string, downloadFileName: string) => void;
  state: GeneratorState;
};

export function PreviewPanel({
  content,
  followUpHref,
  hasCopied,
  onCopyCaption,
  onDownloadCaption,
  onDownloadImage,
  state,
}: PreviewPanelProps) {
  if (state.kind === GeneratorStateKind.Idle) {
    return <IdlePreview label={content.preview.idle.headline} />;
  }
  if (state.kind === GeneratorStateKind.Loading) {
    return <LoadingPreview content={content} stepIndex={state.stepIndex} />;
  }
  if (state.kind === GeneratorStateKind.Error) {
    return <ErrorPreview content={content} code={state.code} />;
  }
  return (
    <SuccessPreview
      caption={state.caption}
      content={content}
      hasCopied={hasCopied}
      downloadFileName={state.downloadFileName}
      authorName={state.post.authorName}
      expertiseDisplay={state.post.expertiseDisplay}
      imageDataUrl={state.imageDataUrl}
      postTitle={state.post.headlinePlain}
      previewHtml={state.previewHtml}
      followUpHref={followUpHref}
      onCopyCaption={onCopyCaption}
      onDownloadCaption={onDownloadCaption}
      onDownloadImage={onDownloadImage}
    />
  );
}

function IdlePreview({ label }: { label: string }) {
  return (
    <div className={styles.preview} data-state="idle">
      <div aria-hidden="true" className={styles.skeletonCard}>
        <div className={styles.skeletonAuthorRow}>
          <span className={styles.skeletonAvatar} />
          <div className={styles.skeletonMeta}>
            <span className={`${styles.skeletonBar} ${styles.skeletonName}`} />
            <span className={`${styles.skeletonBar} ${styles.skeletonRole}`} />
          </div>
        </div>
        <div className={styles.skeletonCaptionBlock}>
          <span className={styles.skeletonBar} />
          <span className={styles.skeletonBar} />
          <span className={styles.skeletonBar} />
        </div>
        <div className={styles.skeletonImage}>
          <span className={styles.skeletonImageLabel}>{label}</span>
        </div>
      </div>
    </div>
  );
}

function LoadingPreview({
  content,
  stepIndex,
}: {
  content: LinkedInPostGeneratorContent;
  stepIndex: number;
}) {
  const { loading } = content.preview;
  return (
    <div className={styles.preview} data-state="loading">
      <div className={styles.previewFrame}>
        <span aria-hidden="true" className={styles.skeletonShimmer} />
        <div className={styles.previewBody}>
          <p className={styles.previewMark} aria-hidden="true">
            ⌗ 0{stepIndex + 1}/0{loading.steps.length}
          </p>
          <h3 className={styles.previewHeadline}>{loading.headline}</h3>
          <p className={styles.previewCopy}>{loading.body}</p>
          <ol aria-live="polite" className={styles.stepsList}>
            {loading.steps.map((step, index) => (
              <li
                className={styles.stepItem}
                data-status={
                  index < stepIndex
                    ? "done"
                    : index === stepIndex
                      ? "active"
                      : "pending"
                }
                key={step}
              >
                <span aria-hidden="true" className={styles.stepDot} />
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

function ErrorPreview({
  code,
  content,
}: {
  code?: string;
  content: LinkedInPostGeneratorContent;
}) {
  const { error } = content.preview;
  const body =
    code === LinkedInPostGeneratorErrorCode.UsageLimitReached
      ? error.limitReachedBody
      : error.body;
  return (
    <div className={styles.preview} data-state="error" role="alert">
      <div className={styles.previewFrame}>
        <div className={styles.previewBody}>
          <p className={styles.previewMark} aria-hidden="true">
            ⌗ ERROR
          </p>
          <h3 className={styles.previewHeadline}>{error.headline}</h3>
          <p className={styles.previewCopy}>{body}</p>
        </div>
      </div>
    </div>
  );
}
