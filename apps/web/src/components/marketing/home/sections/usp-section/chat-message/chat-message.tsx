import Image from "next/image";
import type { ReactNode } from "react";

import type { UspChatAuthor } from "@/i18n/dictionaries/marketing/home-ui";
import visitorPhoto from "../../../../../../../assets/home/unhappy-with-website.jpg";
import styles from "./chat-message.module.css";

type ChatMessageProps = {
  author: UspChatAuthor;
  authorLabel: string;
  highlights?: string[];
  showsAvatar: boolean;
  text: string;
};

function highlightText(text: string, highlights: string[]): ReactNode[] {
  const ranges = highlights
    .map((highlight) => ({ highlight, start: text.indexOf(highlight) }))
    .filter(({ start }) => start >= 0)
    .sort((first, second) => first.start - second.start);
  const parts: ReactNode[] = [];
  let cursor = 0;

  ranges.forEach(({ highlight, start }) => {
    if (start < cursor) {
      return;
    }

    if (start > cursor) {
      parts.push(text.slice(cursor, start));
    }

    parts.push(
      <strong className={styles.highlight} key={`${start}-${highlight}`}>
        {highlight}
      </strong>,
    );
    cursor = start + highlight.length;
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
  showsAvatar,
  text,
}: ChatMessageProps) {
  return (
    <li className={styles.message} data-author={author} data-reveal-item="true">
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
        {highlightText(text, highlights)}
      </p>
    </li>
  );
}
