import Image from "next/image";
import type { ReactNode } from "react";

import type { UspChatAuthor } from "@/i18n/dictionaries/marketing/home-ui";
import visitorPhoto from "@/assets/home/unhappy-with-website.jpg";
import styles from "./chat-message.module.css";

type ChatMessageProps = {
  author: UspChatAuthor;
  authorLabel: string;
  highlights?: string[];
  questionEmphasis?: string[];
  questionHeadingId?: string;
  showsAvatar: boolean;
  text: string;
};

function emphasizeText(text: string, highlights: string[]): ReactNode[] {
  const ranges = highlights
    .map((emphasis) => ({
      emphasis,
      start: text.indexOf(emphasis),
    }))
    .filter(({ start }) => start >= 0)
    .sort((first, second) => first.start - second.start);
  const parts: ReactNode[] = [];
  let cursor = 0;

  ranges.forEach(({ emphasis, start }) => {
    if (start < cursor) {
      return;
    }

    if (start > cursor) {
      parts.push(text.slice(cursor, start));
    }

    parts.push(
      <strong
        className={styles.highlight}
        data-emphasis="usp"
        key={`${start}-${emphasis}`}
      >
        {emphasis}
      </strong>,
    );
    cursor = start + emphasis.length;
  });

  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }

  return parts;
}

export function ChatMessage({
  author,
  authorLabel,
  highlights = [],
  questionEmphasis = [],
  questionHeadingId,
  showsAvatar,
  text,
}: ChatMessageProps) {
  // The question closing a visitor message carries the section heading, so it
  // has to leave the paragraph -- a heading may not be nested inside one.
  const question = questionEmphasis.find((emphasis) => text.endsWith(emphasis));
  const leadText = question
    ? text.slice(0, text.length - question.length)
    : text;

  return (
    <li
      className={styles.message}
      data-author={author}
      data-question-emphasis={questionEmphasis.length > 0 ? "true" : undefined}
      data-reveal-item="true"
    >
      {showsAvatar ? (
        <span aria-hidden="true" className={styles.avatar}>
          {author === "owner" ? (
            <Image
              alt=""
              className={styles.avatarImage}
              height={72}
              src="/assets/moritz-hecht.jpeg"
              width={72}
            />
          ) : (
            <Image
              alt=""
              className={`${styles.avatarImage} ${styles.visitorImage}`}
              height={72}
              src={visitorPhoto}
              width={72}
            />
          )}
        </span>
      ) : (
        <span aria-hidden="true" className={styles.avatarSpacer} />
      )}
      <div className={styles.bubble}>
        <span className="sr-only">{`${authorLabel}: `}</span>
        {leadText ? (
          <p className={styles.bubbleText}>
            {emphasizeText(leadText, highlights)}
          </p>
        ) : null}
        {question ? (
          <h2
            className={styles.questionEmphasis}
            data-emphasis="question"
            id={questionHeadingId}
          >
            {question}
          </h2>
        ) : null}
      </div>
    </li>
  );
}
