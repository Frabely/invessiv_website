import { MessageTextSegmentKind } from "@invessiv/common/constants/ui/message-text-segment-kinds";
import { splitMessageLinks } from "@invessiv/common/patterns/ui/split-message-links";

import { QuaternaryCta } from "../text-cta/text-cta";

export type LinkedTextProps = {
  /** External plain text; it is never interpreted as HTML or Markdown. */
  text: string;
};

/** Plain text with its http(s) links made clickable; links open in a new tab without opener. */
export function LinkedText({ text }: LinkedTextProps) {
  return splitMessageLinks(text).map((segment, index) =>
    segment.kind === MessageTextSegmentKind.Link ? (
      <QuaternaryCta
        href={segment.value}
        key={index}
        rel="noopener noreferrer"
        target="_blank"
      >
        {segment.value}
      </QuaternaryCta>
    ) : (
      <span key={index}>{segment.value}</span>
    ),
  );
}
