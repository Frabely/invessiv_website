"use client";

import type { ChangeEvent } from "react";

/** Hands picked or dropped files over as `File[]`, honouring `multiple`; shared by every file picker. */
export function useFilePicker(
  onFilesSelected: (files: File[]) => void,
  multiple: boolean,
) {
  function emit(files: File[]) {
    const selected = multiple ? files : files.slice(0, 1);
    if (selected.length > 0) onFilesSelected(selected);
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    // Clearing lets the same file be chosen again after a rejection or a cancelled upload.
    event.target.value = "";
    emit(files);
  }

  return { emit, handleChange };
}
