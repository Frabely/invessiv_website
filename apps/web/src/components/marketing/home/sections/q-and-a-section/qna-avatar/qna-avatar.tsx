import Image from "next/image";

import askingPhoto from "@/assets/home/questions-person.jpg";
import profilePhoto from "@/assets/home/profile-image.jpeg";
import styles from "./qna-avatar.module.css";

type QnaAvatarProps = {
  alt: string;
};

/**
 * The circle carries the asking visitor by default and only turns into the
 * portrait while the desktop stage plays its opening question.
 */
export function QnaAvatar({ alt }: QnaAvatarProps) {
  return (
    <div className={styles.frame}>
      <Image
        alt=""
        className={`${styles.image} ${styles.asking}`}
        height={780}
        sizes="(max-width: 959px) 11rem, 18rem"
        src={askingPhoto}
        width={520}
      />
      <Image
        alt={alt}
        className={`${styles.image} ${styles.owner}`}
        height={693}
        sizes="(max-width: 959px) 11rem, 18rem"
        src={profilePhoto}
        width={520}
      />
    </div>
  );
}
