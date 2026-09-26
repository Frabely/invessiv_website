import { MessageTextSegmentKind } from "@/common/constants/ui/message-text-segment-kinds";
import type { MessageTextSegment } from "@/common/contracts/ui/message-text-segment";

const LINK_PATTERN = /https?:\/\/[^\s<>"']+/gi;
const TRAILING_PUNCTUATION = /[.,;:!?)\]]+$/;

/**
 * Splits plain text into text and http(s) link segments. Nothing is interpreted as HTML or
 * Markdown; trailing sentence punctuation stays outside the link.
 */
export function splitMessageLinks(text: string): MessageTextSegment[] {
  const segments: MessageTextSegment[] = [];
  let cursor = 0;
  for (const match of text.matchAll(LINK_PATTERN)) {
    const start = match.index;
    const trailing = TRAILING_PUNCTUATION.exec(match[0])?.[0] ?? "";
    const url = match[0].slice(0, match[0].length - trailing.length);
    if (start > cursor)
      segments.push({
        kind: MessageTextSegmentKind.Text,
        value: text.slice(cursor, start),
      });
    segments.push({ kind: MessageTextSegmentKind.Link, value: url });
    cursor = start + url.length;
  }
  if (cursor < text.length)
    segments.push({
      kind: MessageTextSegmentKind.Text,
      value: text.slice(cursor),
    });
  return segments;
}
