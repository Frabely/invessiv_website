"use client";

import { useState } from "react";
import {
  FileKindIcon,
  type FileKindIconProps,
} from "../file-kind-icon/file-kind-icon";
import styles from "./file-thumbnail.module.css";

// Matches the 2.25rem kind icon box, so names stay aligned and nothing shifts while loading.
const THUMBNAIL_BOX_PX = 36;

export type FileThumbnailProps = FileKindIconProps & {
  /** Signed preview URL; without it, or once it fails, the kind icon stands in. */
  thumbnailUrl?: string | null;
};

/** Decorative like the kind icon: the row always names the file next to it. */
export function FileThumbnail({
  assetKind,
  extension,
  thumbnailUrl,
}: FileThumbnailProps) {
  // Keyed by URL: an expired link falls back, the next signed one is tried again.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  if (!thumbnailUrl || failedUrl === thumbnailUrl)
    return <FileKindIcon assetKind={assetKind} extension={extension} />;
  return (
    <span aria-hidden="true" className={styles.frame}>
      {/* eslint-disable-next-line @next/next/no-img-element -- private signed URLs cannot pass an image optimizer */}
      <img
        alt=""
        className={styles.image}
        decoding="async"
        height={THUMBNAIL_BOX_PX}
        loading="lazy"
        onError={() => setFailedUrl(thumbnailUrl)}
        src={thumbnailUrl}
        width={THUMBNAIL_BOX_PX}
      />
    </span>
  );
}
