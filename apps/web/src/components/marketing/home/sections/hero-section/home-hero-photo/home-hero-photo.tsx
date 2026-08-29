import Image from "next/image";

import heroPhoto from "../../../../../../../assets/home/hero_cutted.jpg";
import styles from "./home-hero-photo.module.css";

type HomeHeroPhotoProps = {
  alt: string;
};

export function HomeHeroPhoto({ alt }: HomeHeroPhotoProps) {
  return (
    <figure className={styles.root}>
      <div className={styles.frame}>
        <Image
          alt={alt}
          className={styles.image}
          fill
          fetchPriority="high"
          priority
          sizes="100vw"
          src={heroPhoto}
        />
      </div>
    </figure>
  );
}
