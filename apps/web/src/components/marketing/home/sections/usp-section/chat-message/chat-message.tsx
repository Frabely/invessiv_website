import Image from "next/image";

import type { UspChatAuthor } from "@/i18n/dictionaries/marketing/home-ui";
import visitorPhoto from "../../../../../../../assets/home/unhappy-with-website.jpg";
import styles from "./chat-message.module.css";

type ChatMessageProps = {
  author: UspChatAuthor;
  authorLabel: string;
  showsAvatar: boolean;
  text: string;
};

export function ChatMessage({
  author,
  authorLabel,
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
        {text}
      </p>
    </li>
  );
}
