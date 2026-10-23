import Image from "next/image";
import type { ReferenceImageKey } from "@/common/constants/marketing/reference-image-key";
import { REFERENCE_IMAGES } from "@/common/constants/marketing/reference-images";
import { REFERENCE_SECTION_IDS } from "@/common/constants/marketing/reference-section-ids";
import styles from "./reference-index-card.module.css";

type ReferenceIndexCardProps = {
  clientName: string;
  imageKey: ReferenceImageKey;
  industry: string;
  priority: boolean;
};

const INDEX_IMAGE_SIZES = "(max-width: 639px) 92vw, 340px";

export function ReferenceIndexCard({
  clientName,
  imageKey,
  industry,
  priority,
}: ReferenceIndexCardProps) {
  return (
    <a className={styles.card} href={`#${REFERENCE_SECTION_IDS[imageKey]}`}>
      <span className={styles.media}>
        <Image
          alt=""
          className={styles.image}
          placeholder="blur"
          priority={priority}
          sizes={INDEX_IMAGE_SIZES}
          src={REFERENCE_IMAGES[imageKey]}
        />
      </span>
      <span className={styles.copy}>
        <span className={styles.name}>{clientName}</span>
        <span className={styles.industry}>{industry}</span>
      </span>
    </a>
  );
}
