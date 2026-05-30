import { GeneratorStateKind } from "@/common/constants/generator/generator-state-kind";
import type { GeneratorState } from "@/common/contracts/generator/generator-state";
import type { Locale } from "@/config/i18n";
import type { LinkedInPostGeneratorContent } from "@/i18n/dictionaries/linkedin-post/generator";
import { SuccessPreview } from "./success-preview";
import styles from "./preview-panel.module.css";

type PreviewPanelProps = {
  content: LinkedInPostGeneratorContent;
  locale: Locale;
  state: GeneratorState;
};

export function PreviewPanel({ content, locale, state }: PreviewPanelProps) {
  if (state.kind === GeneratorStateKind.Idle) {
    return <IdlePreview content={content} />;
  }
  if (state.kind === GeneratorStateKind.Loading) {
    return <LoadingPreview content={content} stepIndex={state.stepIndex} />;
  }
  if (state.kind === GeneratorStateKind.Error) {
    return <ErrorPreview content={content} />;
  }
  return (
    <SuccessPreview
      caption={state.caption}
      content={content}
      downloadFileName={state.downloadFileName}
      imageDataUrl={state.imageDataUrl}
      locale={locale}
      post={state.post}
      previewHtml={state.previewHtml}
    />
  );
}

function IdlePreview({ content }: { content: LinkedInPostGeneratorContent }) {
  const { idle } = content.preview;
  return (
    <div className={styles.preview} data-state="idle">
      <div className={styles.previewFrame}>
        <span aria-hidden="true" className={styles.previewSilhouette} />
        <div className={styles.previewBody}>
          <p className={styles.previewMark} aria-hidden="true">
            ⌗ {idle.stepLabel} 01
          </p>
          <h3 className={styles.previewHeadline}>{idle.headline}</h3>
          <p className={styles.previewCopy}>{idle.body}</p>
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
