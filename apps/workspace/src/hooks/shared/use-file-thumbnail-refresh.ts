"use client";

import { useEffect, useRef } from "react";
import { AssetKind } from "@invessiv/common/constants/files/asset-kind";
import { FileSource } from "@invessiv/common/constants/files/file-source";
import { FILE_THUMBNAIL_EXTENSIONS } from "@invessiv/common/constants/files/file-thumbnail-extensions";
import type { FileThumbnailCandidate } from "@/common/contracts/files/file-thumbnail-candidate";
import type { FileClientResult } from "@/common/contracts/files/file-client-result";
import type { PagedFiles } from "@/common/contracts/files/paged-files";

const REFRESH_DELAYS_MS = [1_000, 2_000, 4_000, 8_000, 15_000];

/** Retries supported uploads without a preview; never resets pagination or hides the loaded list. */
export function useFileThumbnailRefresh<TFile extends FileThumbnailCandidate>(
  requestKey: string,
  files: readonly TFile[],
  pageSize: number,
  loadPage: (page: number) => Promise<FileClientResult<PagedFiles<TFile>>>,
  applyPreview: (original: TFile, thumbnailUrl: string) => void,
) {
  const callbacks = useRef({ loadPage, applyPreview, files });
  const attempts = useRef(new Map<string, number>());
  useEffect(() => {
    callbacks.current = { loadPage, applyPreview, files };
  });
  useEffect(() => {
    attempts.current.clear();
  }, [requestKey]);
  const pending = files.flatMap((file, index) => {
    return file.source === FileSource.Upload &&
      file.assetKind === AssetKind.Image &&
      !file.thumbnailUrl &&
      FILE_THUMBNAIL_EXTENSIONS.some(
        (extension) => extension === file.extension,
      )
      ? [{ file, page: Math.floor(index / pageSize) + 1 }]
      : [];
  });
  const pendingKey = JSON.stringify(
    pending.map(({ file, page }) => [file.id, page]),
  );

  useEffect(() => {
    if (pending.length === 0) return;
    let active = true;
    let timer: ReturnType<typeof setTimeout>;

    function remaining() {
      return pending.filter(
        ({ file }) =>
          (attempts.current.get(file.id) ?? 0) < REFRESH_DELAYS_MS.length,
      );
    }

    function schedule() {
      const waiting = remaining();
      if (!active || waiting.length === 0) return;
      const attempt = Math.min(
        ...waiting.map(({ file }) => attempts.current.get(file.id) ?? 0),
      );
      timer = setTimeout(() => {
        void refresh();
      }, REFRESH_DELAYS_MS[attempt]);
    }

    async function refresh() {
      const eligible = remaining();
      for (const { file } of eligible)
        attempts.current.set(file.id, (attempts.current.get(file.id) ?? 0) + 1);
      const pages = [...new Set(eligible.map(({ page }) => page))];
      await Promise.all(
        pages.map(async (page) => {
          try {
            const result = await callbacks.current.loadPage(page);
            if (!active || !result.ok) return;
            for (const { file } of eligible) {
              const fresh = result.value.files.find(
                (entry) => entry.id === file.id,
              );
              const current = callbacks.current.files.find(
                (entry) => entry.id === file.id,
              );
              if (fresh?.thumbnailUrl && current)
                callbacks.current.applyPreview(current, fresh.thumbnailUrl);
            }
          } catch {
            // A background preview failure never replaces the usable list with an error state.
          }
        }),
      );
      schedule();
    }

    schedule();
    return () => {
      active = false;
      clearTimeout(timer);
    };
    // Loader and list identities change on renders; only a new scope or pending set starts a retry cycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey, pendingKey]);
}
