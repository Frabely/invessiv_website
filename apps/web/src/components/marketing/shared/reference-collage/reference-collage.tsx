import Image from "next/image";
import { REFERENCE_IMAGE_DEVICE } from "@/common/constants/marketing/reference-image-device";
import type { ReferenceImageKey } from "@/common/constants/marketing/reference-image-key";
import { REFERENCE_SHOT_IMAGES } from "@/common/constants/marketing/reference-shot-images";
import type { ReferenceShotContent } from "@/common/contracts/marketing/reference-shot";
import styles from "./reference-collage.module.css";

type ReferenceCollageProps = {
  imageKey: ReferenceImageKey;
  priority: boolean;
  shots: ReferenceShotContent[];
  sizes: string;
};

// The first shot is the overview and sits in front; the others fan out behind it.
const COLLAGE_SLOTS = ["front", "back-left", "back-right"] as const;

export function ReferenceCollage({
  imageKey,
  priority,
  shots,
  sizes,
}: ReferenceCollageProps) {
  return (
    <span
      aria-hidden="true"
      className={styles.collage}
      data-device={REFERENCE_IMAGE_DEVICE[imageKey]}
    >
      {shots.slice(0, COLLAGE_SLOTS.length).map((shot, index) => (
        <span
          className={styles.shot}
          data-slot={COLLAGE_SLOTS[index]}
          key={shot.shotKey}
        >
          <Image
            alt=""
            className={styles.image}
            priority={priority && index === 0}
            sizes={sizes}
            src={REFERENCE_SHOT_IMAGES[shot.shotKey]}
          />
        </span>
      ))}
    </span>
  );
}
