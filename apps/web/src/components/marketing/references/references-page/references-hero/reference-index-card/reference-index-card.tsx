import Image from "next/image";
import { REFERENCE_IMAGE_DEVICE } from "@/common/constants/marketing/reference-image-device";
import type { ReferenceImageKey } from "@/common/constants/marketing/reference-image-key";
import { REFERENCE_SECTION_IDS } from "@/common/constants/marketing/reference-section-ids";
import { REFERENCE_SHOT_IMAGES } from "@/common/constants/marketing/reference-shot-images";
import type { ReferenceShotContent } from "@/common/contracts/marketing/reference-shot";
import styles from "./reference-index-card.module.css";

type ReferenceIndexCardProps = {
  clientName: string;
  imageKey: ReferenceImageKey;
  industry: string;
  priority: boolean;
  shots: ReferenceShotContent[];
};

// The first shot is the overview and sits in front; the others fan out behind it.
const COLLAGE_SLOTS = ["front", "back-left", "back-right"] as const;
const COLLAGE_IMAGE_SIZES = "(max-width: 899px) 70vw, 320px";

export function ReferenceIndexCard({
  clientName,
  imageKey,
  industry,
  priority,
  shots,
}: ReferenceIndexCardProps) {
  const collageShots = shots.slice(0, COLLAGE_SLOTS.length);

  return (
    <a className={styles.card} href={`#${REFERENCE_SECTION_IDS[imageKey]}`}>
      <span
        aria-hidden="true"
        className={styles.collage}
        data-device={REFERENCE_IMAGE_DEVICE[imageKey]}
      >
        {collageShots.map((shot, index) => (
          <span
            className={styles.shot}
            data-slot={COLLAGE_SLOTS[index]}
            key={shot.shotKey}
          >
            <Image
              alt=""
              className={styles.image}
              priority={priority && index === 0}
              sizes={COLLAGE_IMAGE_SIZES}
              src={REFERENCE_SHOT_IMAGES[shot.shotKey]}
            />
          </span>
        ))}
      </span>
      <span className={styles.copy}>
        <span className={styles.name}>{clientName}</span>
        <span className={styles.industry}>{industry}</span>
      </span>
    </a>
  );
}
