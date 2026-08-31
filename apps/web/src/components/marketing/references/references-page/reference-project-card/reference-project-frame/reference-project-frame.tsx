import Image from "next/image";
import { REFERENCE_DEVICE } from "@/common/constants/marketing/reference-device";
import { REFERENCE_IMAGE_DEVICE } from "@/common/constants/marketing/reference-image-device";
import { REFERENCE_IMAGES } from "@/common/constants/marketing/reference-images";
import type { ReferenceImageKey } from "@/common/constants/marketing/reference-image-key";
import styles from "./reference-project-frame.module.css";

type ReferenceProjectFrameProps = {
  imageAlt: string;
  imageKey: ReferenceImageKey;
  priority: boolean;
};

const FRAME_IMAGE_SIZES = "(max-width: 767px) 92vw, 560px";

export function ReferenceProjectFrame({
  imageAlt,
  imageKey,
  priority,
}: ReferenceProjectFrameProps) {
  const device = REFERENCE_IMAGE_DEVICE[imageKey];

  return (
    <div className={styles.frame} data-device={device}>
      <div aria-hidden="true" className={styles.chrome}>
        {device === REFERENCE_DEVICE.Browser ? (
          <>
            <span className={styles.chromeDot} />
            <span className={styles.chromeDot} />
            <span className={styles.chromeDot} />
            <div className={styles.chromeBar} />
          </>
        ) : (
          <>
            <div className={styles.phoneStatusMeta}>
              <span className={styles.phoneTime}>09:41</span>
            </div>
            <div className={styles.phoneIsland} />
            <div className={styles.phoneStatusIcons}>
              <span className={styles.phoneSignal} />
              <span className={styles.phoneWifi} />
              <span className={styles.phoneBattery} />
            </div>
          </>
        )}
      </div>

      <div className={styles.viewport}>
        <Image
          alt={imageAlt}
          className={styles.image}
          placeholder="blur"
          priority={priority}
          sizes={FRAME_IMAGE_SIZES}
          src={REFERENCE_IMAGES[imageKey]}
        />
      </div>

      {device === REFERENCE_DEVICE.Phone ? (
        <div aria-hidden="true" className={styles.phoneHomeIndicator} />
      ) : null}
    </div>
  );
}
