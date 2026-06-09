import { GeneratorStateKind } from "@/common/constants/generator/generator-state-kind";
import type { GeneratorState } from "@/common/contracts/generator/generator-state";
import type { LeadIdentity } from "@/common/contracts/generator/lead-identity";
import type { Locale } from "@/config/i18n";
import type { LinkedInPostGeneratorContent } from "@/i18n/dictionaries/linkedin-post/generator";
import { SuccessPreview } from "./success-preview";
import { LimitReachedPreview } from "./limit-reached-preview/limit-reached-preview";
import { ErrorPreview } from "./error-preview/error-preview";

// Loading is rendered in-generator (GeneratingPanel), never here, so the preview
// only ever carries the resolved states.
type PreviewState = Exclude<
  GeneratorState,
  { kind: typeof GeneratorStateKind.Loading }
>;

type PreviewPanelProps = {
  content: LinkedInPostGeneratorContent;
  followUpHref: string;
  hasCopied: boolean;
  locale: Locale;
  onCopyCaption: (caption: string) => void;
  onLeadIdentityChange: (identity: LeadIdentity) => void;
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
  onLeadIdentityChange,
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
    case GeneratorStateKind.Error:
      return <ErrorPreview content={content} />;
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
          locale={locale}
          deliveryToken={state.deliveryToken}
          onCopyCaption={onCopyCaption}
          onLeadIdentityChange={onLeadIdentityChange}
          onRequestNewPost={onRequestNewPost}
          onRequestCustomWorkflow={onRequestCustomWorkflow}
        />
      );
  }
}
