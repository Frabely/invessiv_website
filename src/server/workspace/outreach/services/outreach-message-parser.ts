export interface ParsedMessage {
  subject?: string;
  body: string;
}

const SUBJECT_PREFIXES = ["Betreff:", "Subject:", "Titel:"];
const MESSAGE_PREFIXES = ["Message:", "Nachricht:"];
const LINE_BREAK_PATTERN = /\r?\n/;
const LEADING_BLANK_LINES_PATTERN = /^(?:[ \t]*\r?\n)+/;
const OUTER_CODE_FENCE_PATTERN =
  /^```(?:[a-z]+)?[ \t]*\r?\n([\s\S]*?)\r?\n```[ \t]*$/i;
const MESSAGE_LABEL_PATTERN = new RegExp(
  `^(?:${MESSAGE_PREFIXES.map((prefix) => escapeRegExp(prefix)).join("|")})[ \\t]*\\r?\\n`,
  "i",
);

function stripMarkdownCodeFence(rawText: string): string {
  const trimmed = rawText.trim();
  const fencedMatch = OUTER_CODE_FENCE_PATTERN.exec(trimmed);
  if (!fencedMatch) {
    return rawText;
  }

  return fencedMatch[1];
}

function parseSubjectPrefix(line: string): string | null {
  for (const prefix of SUBJECT_PREFIXES) {
    if (!line.startsWith(prefix)) {
      continue;
    }

    return line.slice(prefix.length).trim();
  }

  return null;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function stripMessageWrapper(rawText: string): string | null {
  const withoutLeadingBlankLines = rawText.replace(
    LEADING_BLANK_LINES_PATTERN,
    "",
  );
  const wrapperMatch = MESSAGE_LABEL_PATTERN.exec(withoutLeadingBlankLines);

  if (!wrapperMatch) {
    return null;
  }

  return withoutLeadingBlankLines.slice(wrapperMatch[0].length);
}

function parseRawText(rawText: string): ParsedMessage {
  const textWithoutOuterFence = stripMarkdownCodeFence(rawText);
  const textWithoutLeadingBlankLines = textWithoutOuterFence.replace(
    LEADING_BLANK_LINES_PATTERN,
    "",
  );

  const firstLineBreakIndex =
    textWithoutLeadingBlankLines.search(LINE_BREAK_PATTERN);
  const firstLine =
    firstLineBreakIndex === -1
      ? textWithoutLeadingBlankLines
      : textWithoutLeadingBlankLines.slice(0, firstLineBreakIndex);
  const subject = parseSubjectPrefix(firstLine);

  if (subject === null) {
    return { body: textWithoutLeadingBlankLines };
  }

  if (firstLineBreakIndex === -1) {
    return { body: textWithoutLeadingBlankLines };
  }

  const restAfterFirstLine = textWithoutLeadingBlankLines.slice(
    firstLineBreakIndex + 1,
  );
  const blankLineMatch = LEADING_BLANK_LINES_PATTERN.exec(restAfterFirstLine);
  const bodyCandidate =
    blankLineMatch !== null
      ? restAfterFirstLine.slice(blankLineMatch[0].length)
      : restAfterFirstLine;
  const bodySource =
    stripMessageWrapper(bodyCandidate) ??
    (blankLineMatch !== null ? bodyCandidate : null);

  if (bodySource === null) {
    return { body: textWithoutLeadingBlankLines };
  }

  const bodyWithoutOuterFence = stripMarkdownCodeFence(bodySource).replace(
    LEADING_BLANK_LINES_PATTERN,
    "",
  );

  return { subject, body: bodyWithoutOuterFence };
}

function parse(_channel: string, rawText: string): ParsedMessage {
  return parseRawText(rawText);
}

export const outreachMessageParser = { parse };
