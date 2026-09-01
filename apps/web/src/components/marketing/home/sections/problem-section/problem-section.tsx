"use client";

import Image from "next/image";
import { useRef } from "react";

import { EyebrowPill } from "@/components/shared/eyebrow-pill/eyebrow-pill";
import { useStaggeredSectionReveal } from "@/hooks/marketing/use-staggered-section-reveal";
import type { ProblemIconKey } from "@/i18n/dictionaries/marketing/home-ui";
import ambientPhoto from "@/assets/home/unhappy-with-website-2.jpg";
import centerPhoto from "@/assets/home/unhappy-with-website.jpg";
import { ProblemIcon } from "./problem-icon/problem-icon";
import styles from "./problem-section.module.css";

const LEFT_COLUMN_COUNT = 3;

type ProblemSectionContent = {
  conclusion: string;
  kicker: string;
  listAriaLabel: string;
  photoAlt: string;
  problems: { iconKey: ProblemIconKey; label: string }[];
  resolution: string;
  title: string;
};

type ProblemSectionProps = {
  content: ProblemSectionContent;
  id: string;
};

export function ProblemSection({ content, id }: ProblemSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  useStaggeredSectionReveal(sectionRef, content.title);

  return (
    <section
      aria-labelledby={`${id}-title`}
      className={styles.section}
      id={id}
      ref={sectionRef}
    >
      <div aria-hidden="true" className={styles.ambient}>
        <Image
          alt=""
          className={styles.ambientImage}
          fill
          sizes="(max-width: 900px) 90vw, 640px"
          src={ambientPhoto}
        />
      </div>

      <div className={styles.inner}>
        <header className={styles.header} data-reveal-item="true">
          <EyebrowPill className={styles.kicker}>{content.kicker}</EyebrowPill>
          <h2 className={styles.title} id={`${id}-title`}>
            {content.title}
          </h2>
        </header>

        <div className={styles.stage}>
          <figure className={styles.photo} data-reveal-item="true">
            <Image
              alt={content.photoAlt}
              className={styles.photoImage}
              fill
              sizes="(max-width: 900px) 92vw, 320px"
              src={centerPhoto}
            />
          </figure>

          <ul
            aria-label={content.listAriaLabel}
            className={styles.list}
            role="list"
          >
            {content.problems.map((problem, index) => (
              <li
                className={styles.problem}
                data-reveal-item="true"
                data-side={index < LEFT_COLUMN_COUNT ? "left" : "right"}
                key={problem.iconKey}
              >
                <span className={styles.iconWell}>
                  <ProblemIcon iconKey={problem.iconKey} />
                </span>
                <span className={styles.text}>{problem.label}</span>
                <span aria-hidden="true" className={styles.leader} />
              </li>
            ))}
          </ul>
        </div>

        <footer className={styles.verdict} data-reveal-item="true">
          <p className={styles.conclusion}>{content.conclusion}</p>
          <p className={styles.resolution}>{content.resolution}</p>
        </footer>
      </div>
    </section>
  );
}
