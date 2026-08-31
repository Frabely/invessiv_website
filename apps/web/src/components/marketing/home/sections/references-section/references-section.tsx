import type { ReferenceEntry } from "@/common/contracts/marketing/reference-entry";
import type { ReferenceLabels } from "@/common/contracts/marketing/reference-labels";
import { EyebrowPill } from "@/components/shared/eyebrow-pill/eyebrow-pill";
import { ReferencesShowcase } from "./references-showcase/references-showcase";
import styles from "./references-section.module.css";

type ReferencesSectionProps = {
  entries: ReferenceEntry[];
  id: string;
  kicker: string;
  labels: ReferenceLabels;
  referencesHref: string;
  title: string;
};

export function ReferencesSection({
  entries,
  id,
  kicker,
  labels,
  referencesHref,
  title,
}: ReferencesSectionProps) {
  return (
    <section className={styles.section} id={id}>
      <div className={styles.headerCopy}>
        <EyebrowPill>{kicker}</EyebrowPill>
        <h2 className={styles.title}>{title}</h2>
      </div>

      <ReferencesShowcase
        entries={entries}
        labels={labels}
        referencesHref={referencesHref}
      />
    </section>
  );
}
