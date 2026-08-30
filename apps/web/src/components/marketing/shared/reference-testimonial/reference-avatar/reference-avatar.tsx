import Image from "next/image";
import { REFERENCE_AVATAR_IMAGES } from "@/common/constants/marketing/reference-images";
import type { ReferenceAvatarKey } from "@/common/constants/marketing/reference-avatar-key";
import styles from "./reference-avatar.module.css";

type ReferenceAvatarProps = {
  alt?: string;
  authorName: string;
  avatarKey?: ReferenceAvatarKey;
};

const NAME_TITLES = new Set(["dr", "prof", "dipl", "med"]);

function getAuthorInitials(authorName: string) {
  const nameParts = authorName
    .split(/\s+/)
    .map((part) => part.replace(/[^A-Za-zÄÖÜäöüß]/g, ""))
    .filter((part) => part.length > 0 && !NAME_TITLES.has(part.toLowerCase()));

  if (!nameParts.length) {
    return "";
  }

  const [firstPart] = nameParts;
  const lastPart = nameParts[nameParts.length - 1];

  return [firstPart, lastPart]
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function ReferenceAvatar({
  alt,
  authorName,
  avatarKey,
}: ReferenceAvatarProps) {
  if (avatarKey) {
    return (
      <span className={styles.avatarImageFrame}>
        <Image
          alt={alt ?? ""}
          className={styles.avatarImage}
          data-avatar={avatarKey}
          fill
          sizes="176px"
          src={REFERENCE_AVATAR_IMAGES[avatarKey]}
        />
      </span>
    );
  }

  return (
    <span aria-hidden="true" className={styles.avatarFallback}>
      {getAuthorInitials(authorName)}
    </span>
  );
}
