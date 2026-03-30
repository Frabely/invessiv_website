"use client";

import { useEffect, useState } from "react";

type UseProofPreviewModeParams = {
  desktopModeKey: string;
  mobileModeKey: string;
};

export function useProofPreviewMode({
  desktopModeKey,
  mobileModeKey,
}: UseProofPreviewModeParams) {
  const [selectedModeKey, setSelectedModeKey] = useState(desktopModeKey);
  const [hasManualSelection, setHasManualSelection] = useState(false);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }

    const mediaQuery = window.matchMedia("(max-width: 759px)");

    const syncModeToViewport = () => {
      if (hasManualSelection) {
        return;
      }

      setSelectedModeKey(mediaQuery.matches ? mobileModeKey : desktopModeKey);
    };

    syncModeToViewport();
    mediaQuery.addEventListener("change", syncModeToViewport);

    return () => {
      mediaQuery.removeEventListener("change", syncModeToViewport);
    };
  }, [desktopModeKey, hasManualSelection, mobileModeKey]);

  const selectMode = (nextModeKey: string) => {
    setHasManualSelection(true);
    setSelectedModeKey(nextModeKey);
  };

  return {
    selectMode,
    selectedModeKey,
  };
}
