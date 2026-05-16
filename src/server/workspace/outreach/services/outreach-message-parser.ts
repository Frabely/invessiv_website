export interface ParsedMessage {
  subject?: string;
  body: string;
}

const SUBJECT_PREFIX = "Betreff: ";

function parseRawText(rawText: string): ParsedMessage {
  if (!rawText.startsWith(SUBJECT_PREFIX)) {
    return { body: rawText };
  }

  const newlineIndex = rawText.indexOf("\n");
  if (newlineIndex === -1) {
    const subject = rawText.slice(SUBJECT_PREFIX.length).trim();
    return { subject, body: "" };
  }

  const subject = rawText.slice(SUBJECT_PREFIX.length, newlineIndex).trim();
  let bodyStart = newlineIndex + 1;
  while (bodyStart < rawText.length && rawText[bodyStart] === "\n") {
    bodyStart++;
  }
  const body = rawText.slice(bodyStart);

  return { subject, body };
}

function parse(_channel: string, rawText: string): ParsedMessage {
  return parseRawText(rawText);
}

export const outreachMessageParser = { parse };
