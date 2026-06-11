import { GeneratorStateKind } from "@/common/constants/generator/ui/generator-state-kind";
import type { GeneratorState } from "@/common/contracts/generator/ui/generator-state";
import type { Locale } from "@/config/i18n";
import type { LinkedInPostGeneratorContent } from "@/i18n/dictionaries/linkedin-post/generator";
import { SuccessPreview } from "./success-preview";
import { LimitReachedPreview } from "./limit-reached-preview/limit-reached-preview";

type PreviewState = Exclude<
  GeneratorState,
  | { kind: typeof GeneratorStateKind.Loading }
  | { kind: typeof GeneratorStateKind.Error }
>;

type PreviewPanelProps = {
  content: LinkedInPostGeneratorContent;
  followUpHref: string;
  hasCopied: boolean;
  locale: Locale;
  onCopyCaption: (caption: string) => void;
  onDownloadPost: () => void;
  onRequestNewPost: () => void;
  onRequestCustomWorkflow: () => void;
  state: PreviewState;
};

/** Routes a resolved generator state to its dedicated preview component. */
export function PreviewPanel({
  content,
  followUpHref,
  hasCopied,
  locale,
  onCopyCaption,
  onDownloadPost,
  onRequestNewPost,
  onRequestCustomWorkflow,
  state,
}: PreviewPanelProps) {
  switch (state.kind) {
    case GeneratorStateKind.LimitReached:
      return (
        <LimitReachedPreview
          content={content.preview.limitReached}
          followUpHref={followUpHref}
          locale={locale}
          onRequestCustomWorkflow={onRequestCustomWorkflow}
          usageLimit={state.usageLimit}
        />
      );
    case GeneratorStateKind.Success:
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
          imageDataUrl={state.imageDataUrl}
          onCopyCaption={onCopyCaption}
          onDownloadPost={onDownloadPost}
          onRequestNewPost={onRequestNewPost}
          onRequestCustomWorkflow={onRequestCustomWorkflow}
        />
      );
  }
}
