"use client";

import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import { useRef } from "react";

import { SECTION_HREFS } from "@/config/navigation/home";
import { useStaggeredSectionReveal } from "@/hooks/marketing/use-staggered-section-reveal";
import type { UspChatAuthor } from "@/i18n/dictionaries/marketing/home-ui";
import backdropPhoto from "@/assets/home/back-mountain.jpeg";
import { ChatMessage } from "./chat-message/chat-message";
import styles from "./usp-section.module.css";

type UspSectionContent = {
  authorLabels: Record<UspChatAuthor, string>;
  chatAriaLabel: string;
  messages: {
    author: UspChatAuthor;
    highlights?: string[];
    text: string;
  }[];
  introMessage: {
    author: UspChatAuthor;
    text: string;
  };
  replyCtaLabel: string;
  title: string;
};

type UspSectionProps = {
  content: UspSectionContent;
  id: string;
};

export function UspSection({ content, id }: UspSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  useStaggeredSectionReveal(sectionRef, content.title, { staggerMs: 240 });

  return (
    <section
      aria-labelledby={`${id}-title`}
      className={styles.section}
      id={id}
      ref={sectionRef}
    >
      <div aria-hidden="true" className={styles.backdrop}>
        <span className={styles.backdropTrack}>
          <span className={styles.backdropViewport}>
            <Image
              alt=""
              className={styles.backdropImage}
              fill
              sizes="100vw"
              src={backdropPhoto}
            />
          </span>
        </span>
      </div>

      <div className={styles.inner}>
        <ol aria-label={content.chatAriaLabel} className={styles.introThread}>
          <ChatMessage
            author={content.introMessage.author}
            authorLabel={content.authorLabels[content.introMessage.author]}
            showsAvatar={true}
            text={content.introMessage.text}
          />
        </ol>

        <h2 className={styles.title} data-reveal-item="true" id={`${id}-title`}>
          {content.title}
        </h2>

        <ol aria-label={content.chatAriaLabel} className={styles.thread}>
          {content.messages.map((message, index) => {
            const nextMessage = content.messages[index + 1];
            return (
              <ChatMessage
                author={message.author}
                authorLabel={content.authorLabels[message.author]}
                highlights={message.highlights}
                key={message.text}
                showsAvatar={
                  !nextMessage || nextMessage.author !== message.author
                }
                text={message.text}
              />
            );
          })}
        </ol>

        <div className={styles.replyBar} data-reveal-item="true">
          <span aria-hidden="true" className={styles.typingIndicator}>
            <span />
            <span />
            <span />
          </span>
          <a
            className={styles.reply}
            data-analytics-event="cta_click"
            data-analytics-location="usp"
            data-analytics-target="form"
            data-analytics-variant="primary"
            href={SECTION_HREFS.contact}
          >
            <span className={styles.replyLabel}>{content.replyCtaLabel}</span>
            <span aria-hidden="true" className={styles.replySend}>
              <FontAwesomeIcon
                aria-hidden="true"
                className={styles.replySendIcon}
                icon={faArrowRight}
              />
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
