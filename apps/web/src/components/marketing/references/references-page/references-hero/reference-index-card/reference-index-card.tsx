import type { ReferenceImageKey } from "@/common/constants/marketing/reference-image-key";
import { REFERENCE_SECTION_IDS } from "@/common/constants/marketing/reference-section-ids";
import type { ReferenceShotContent } from "@/common/contracts/marketing/reference-shot";
import { ReferenceCollage } from "@/components/marketing/shared/reference-collage/reference-collage";
import styles from "./reference-index-card.module.css";

type ReferenceIndexCardProps = {
  clientName: string;
  imageKey: ReferenceImageKey;
  industry: string;
  priority: boolean;
  shots: ReferenceShotContent[];
};

const COLLAGE_IMAGE_SIZES = "(max-width: 899px) 70vw, 320px";

export function ReferenceIndexCard({
  clientName,
  imageKey,
  industry,
  priority,
  shots,
}: ReferenceIndexCardProps) {
  return (
    <a className={styles.card} href={`#${REFERENCE_SECTION_IDS[imageKey]}`}>
      <ReferenceCollage
        imageKey={imageKey}
        priority={priority}
        shots={shots}
        sizes={COLLAGE_IMAGE_SIZES}
      />
      <span className={styles.copy}>
        <span className={styles.name}>{clientName}</span>
        <span className={styles.industry}>{industry}</span>
      </span>
    </a>
  );
}
