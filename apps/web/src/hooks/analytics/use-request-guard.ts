"use client";

import { useCallback, useEffect, useRef } from "react";

/** Invalidates pending UI results on unmount or when another request starts. */
export function useRequestGuard() {
  const generationRef = useRef(0);
  const activeRef = useRef(true);

  useEffect(() => {
    activeRef.current = true;
    return () => {
      activeRef.current = false;
      generationRef.current += 1;
    };
  }, []);

  return useCallback(() => {
    const generation = ++generationRef.current;
    return () => activeRef.current && generationRef.current === generation;
  }, []);
}
