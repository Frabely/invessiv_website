"use client";

import { useEffect, useRef } from "react";

/** Stages files chosen before an upload dialog mounted exactly once. */
export function useInitialUploadFiles(
  files: readonly File[] | undefined,
  stage: (files: readonly File[]) => void,
) {
  const stagedRef = useRef(false);
  useEffect(() => {
    if (stagedRef.current || !files?.length) return;
    stagedRef.current = true;
    stage(files);
  }, [files, stage]);
}
