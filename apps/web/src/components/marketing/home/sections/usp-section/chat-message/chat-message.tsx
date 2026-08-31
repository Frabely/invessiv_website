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
  showsAvatar: boolean;
  text: string;
};

type EmphasisKind = "question" | "usp";

function emphasizeText(
  text: string,
  highlights: string[],
  questionEmphasis: string[],
): ReactNode[] {
  const ranges = [
    ...highlights.map((emphasis) => ({ emphasis, kind: "usp" as const })),
    ...questionEmphasis.map((emphasis) => ({
      emphasis,
      kind: "question" as const,
    })),
  ]
    .map(({ emphasis, kind }) => ({
      emphasis,
      kind,
      start: text.indexOf(emphasis),
    }))
    .filter(({ start }) => start >= 0)
    .sort((first, second) => first.start - second.start);
  const parts: ReactNode[] = [];
  let cursor = 0;

  ranges.forEach(({ emphasis, kind, start }) => {
    if (start < cursor) {
      return;
    }

    if (start > cursor) {
      parts.push(text.slice(cursor, start));
    }

    parts.push(
      <strong
        className={
          kind === "question" ? styles.questionEmphasis : styles.highlight
        }
        data-emphasis={kind satisfies EmphasisKind}
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
  showsAvatar,
  text,
}: ChatMessageProps) {
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
      <p className={styles.bubble}>
        <span className="sr-only">{`${authorLabel}: `}</span>
        {emphasizeText(text, highlights, questionEmphasis)}
      </p>
    </li>
  );
}
