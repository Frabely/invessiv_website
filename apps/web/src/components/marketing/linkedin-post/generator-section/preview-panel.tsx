import { GeneratorStateKind } from "@/common/constants/generator/generator-state-kind";
import type { GeneratorState } from "@/common/contracts/generator/generator-state";
import type { Locale } from "@/config/i18n";
import type { LinkedInPostGeneratorContent } from "@/i18n/dictionaries/linkedin-post/generator";
import { SuccessPreview } from "./success-preview";
import { LimitReachedPreview } from "./limit-reached-preview/limit-reached-preview";
import type { LeadIdentity } from "@/common/contracts/generator/lead-identity";
import styles from "./preview-panel.module.css";

type PreviewPanelProps = {
  content: LinkedInPostGeneratorContent;
  followUpHref: string;
  hasCopied: boolean;
  locale: Locale;
  onCopyCaption: (caption: string) => void;
  onLeadIdentityChange: (identity: LeadIdentity) => void;
  onRequestCustomWorkflow: () => void;
  state: GeneratorState;
};

export function PreviewPanel({
  content,
  followUpHref,
  hasCopied,
  locale,
  onCopyCaption,
  onLeadIdentityChange,
  onRequestCustomWorkflow,
  state,
}: PreviewPanelProps) {
  if (state.kind === GeneratorStateKind.Idle) {
    return <IdlePreview label={content.preview.idle.headline} />;
  }
  if (state.kind === GeneratorStateKind.Loading) {
    return <LoadingPreview content={content} stepIndex={state.stepIndex} />;
  }
  if (state.kind === GeneratorStateKind.LimitReached) {
    return (
      <LimitReachedPreview
        content={content.preview.limitReached}
        followUpHref={followUpHref}
        locale={locale}
        onRequestCustomWorkflow={onRequestCustomWorkflow}
        usageLimit={state.usageLimit}
      />
    );
  }
  if (state.kind === GeneratorStateKind.Error) {
    return <ErrorPreview content={content} />;
  }
  return (
    <SuccessPreview
      caption={state.caption}
      content={content}
      hasCopied={hasCopied}
      authorName={state.post.authorName}
      expertiseDisplay={state.post.expertiseDisplay}
      postTitle={state.post.headlinePlain}
      previewHtml={state.previewHtml}
      followUpHref={followUpHref}
      locale={locale}
      deliveryToken={state.deliveryToken}
      onCopyCaption={onCopyCaption}
      onLeadIdentityChange={onLeadIdentityChange}
      onRequestCustomWorkflow={onRequestCustomWorkflow}
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

function ErrorPreview({ content }: { content: LinkedInPostGeneratorContent }) {
  const { error } = content.preview;
  return (
    <div className={styles.preview} data-state="error" role="alert">
      <div className={styles.previewFrame}>
        <div className={styles.previewBody}>
          <p className={styles.previewMark} aria-hidden="true">
            ⌗ ERROR
          </p>
          <h3 className={styles.previewHeadline}>{error.headline}</h3>
          <p className={styles.previewCopy}>{error.body}</p>
        </div>
      </div>
    </div>
  );
}
