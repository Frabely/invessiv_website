"use client";

import { useEffect, useState } from "react";
import { FilePreviewKind } from "@invessiv/common/constants/files/file-preview-kind";
import { DOWNLOAD_URL_TTL_MS } from "@invessiv/common/constants/files/upload-limits";
import type { FilePreviewItem } from "@invessiv/common/contracts/files/file-preview-item";

// A null source means the preview could not be loaded.
type PreviewState = { fileId: string; source: string | null };

// Refreshed well before the signed URL's TTL expires, so a preview left open never goes stale.
const PREVIEW_URL_REFRESH_MS = DOWNLOAD_URL_TTL_MS - 60_000;

/**
 * Loads the preview source of one file and keeps a signed URL fresh while it is shown. Returns
 * null while loading; `source` null means the preview could not be loaded.
 */
export function useFilePreviewSource<TFile extends FilePreviewItem>(
  file: TFile | null,
  kind: FilePreviewKind | null,
  loadSourceAction: (
    file: TFile,
    kind: FilePreviewKind,
  ) => Promise<string | null>,
): PreviewState | null {
  const [preview, setPreview] = useState<PreviewState | null>(null);

  useEffect(() => {
    if (!file || !kind) return;
    let cancelled = false;
    let timer: number | undefined;

    function load() {
      if (!file || !kind) return;
      void loadSourceAction(file, kind).then((source) => {
        if (cancelled) return;
        setPreview({ fileId: file.id, source });
        // A signed inline URL expires; text is read through the app and never does.
        if (source !== null && kind !== FilePreviewKind.Text)
          timer = window.setTimeout(load, PREVIEW_URL_REFRESH_MS);
      });
    }

    load();
    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
    // The loader is a callback prop; reloading on its identity would refetch on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, kind]);

  return preview?.fileId === file?.id ? preview : null;
}
