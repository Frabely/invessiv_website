import type { ReferenceCaseStudyContent } from "@/common/contracts/marketing/reference-case-study";
import type { ReferenceCaseStudyLabels } from "@/common/contracts/marketing/reference-case-study-labels";
import { EyebrowPill } from "@/components/shared/eyebrow-pill/eyebrow-pill";
import { ReferenceTeaser } from "./reference-teaser/reference-teaser";
import styles from "./references-section.module.css";

type ReferencesSectionProps = {
  id: string;
  kicker: string;
  labels: ReferenceCaseStudyLabels;
  linkLabel: string;
  references: ReferenceCaseStudyContent[];
  referencesHref: string;
  title: string;
};

export function ReferencesSection({
  id,
  kicker,
  labels,
  linkLabel,
  references,
  referencesHref,
  title,
}: ReferencesSectionProps) {
  return (
    <section className={styles.section} id={id}>
      <div className={styles.headerCopy}>
        <EyebrowPill>{kicker}</EyebrowPill>
        <h2 className={styles.title}>{title}</h2>
      </div>

      <div className={styles.list}>
        {references.map((reference, index) => (
          <ReferenceTeaser
            isReversed={index % 2 === 0}
            key={reference.imageKey}
            labels={labels}
            linkLabel={linkLabel}
            reference={reference}
            referencesHref={referencesHref}
          />
        ))}
      </div>
    </section>
  );
}
