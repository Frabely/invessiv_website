"use client";

import Image from "next/image";
import { useState } from "react";
import { REFERENCE_IMAGE_DEVICE } from "@/common/constants/marketing/reference-image-device";
import type { ReferenceImageKey } from "@/common/constants/marketing/reference-image-key";
import { REFERENCE_SHOT_IMAGES } from "@/common/constants/marketing/reference-shot-images";
import type { ReferenceShotContent } from "@/common/contracts/marketing/reference-shot";
import { ReferenceProjectFrame } from "../reference-project-frame/reference-project-frame";
import styles from "./reference-result-gallery.module.css";

type ReferenceResultGalleryProps = {
  imageKey: ReferenceImageKey;
  label: string;
  shots: ReferenceShotContent[];
};

const THUMB_IMAGE_SIZES = "160px";

export function ReferenceResultGallery({
  imageKey,
  label,
  shots,
}: ReferenceResultGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeShot = shots[activeIndex] ?? shots[0];

  if (!activeShot) {
    return null;
  }

  return (
    <figure
      className={styles.gallery}
      data-device={REFERENCE_IMAGE_DEVICE[imageKey]}
    >
      <div className={styles.stage} key={activeShot.shotKey}>
        <ReferenceProjectFrame
          imageAlt={activeShot.alt}
          imageKey={imageKey}
          priority={false}
          shotKey={activeShot.shotKey}
        />
      </div>

      <figcaption aria-live="polite" className={styles.caption}>
        {activeShot.caption}
      </figcaption>

      {shots.length > 1 ? (
        <div aria-label={label} className={styles.thumbs} role="group">
          {shots.map((shot, index) => (
            <button
              aria-pressed={index === activeIndex}
              className={styles.thumb}
              key={shot.shotKey}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              <span className={styles.thumbMedia}>
                <Image
                  alt=""
                  className={styles.thumbImage}
                  sizes={THUMB_IMAGE_SIZES}
                  src={REFERENCE_SHOT_IMAGES[shot.shotKey]}
                />
              </span>
              <span className={styles.thumbLabel}>{shot.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </figure>
  );
}
