"use client";

import { useRef } from "react";

import { QNA_STAGE_PHASE } from "@/common/constants/marketing/qna-stage-phase";
import type {
  QnaIntroCopy,
  QnaItemCopy,
  QnaSecondaryContactCopy,
} from "@/common/contracts/marketing/qna-copy";
import { useQnaStage } from "@/hooks/marketing/use-qna-stage";
import { BrandMarkBackdrop } from "@/components/marketing/shared/brand-mark-backdrop/brand-mark-backdrop";
import { QnaBubbleBoard } from "./qna-bubble-board/qna-bubble-board";
import styles from "./q-and-a-section.module.css";

type QAndASectionProps = {
  avatarAlt: string;
  id: string;
  intro: QnaIntroCopy;
  items: QnaItemCopy[];
  secondaryContact?: QnaSecondaryContactCopy;
  title: string;
};

export function QAndASection({
  avatarAlt,
  id,
  intro,
  items,
  secondaryContact,
  title,
}: QAndASectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);

  useQnaStage({ sectionRef });

  return (
    <section
      className={styles.section}
      data-qna-phase={QNA_STAGE_PHASE.Board}
      id={id}
      ref={sectionRef}
    >
      <div className={styles.stage}>
        <span className={styles.brandMark}>
          <BrandMarkBackdrop sizes="(max-width: 959px) 90vw, 44rem" />
        </span>

        <QnaBubbleBoard
          avatarAlt={avatarAlt}
          id={id}
          intro={intro}
          items={items}
          secondaryContact={secondaryContact}
          title={title}
        />
      </div>
    </section>
  );
}
