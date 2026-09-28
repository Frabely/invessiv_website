"use client";

import { type ChangeEvent, type ReactNode, useId } from "react";
import { faArrowUpFromBracket } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FileDropZoneVariant } from "@invessiv/common/constants/ui/file-drop-zone-variants";
import { useFileDragTarget } from "../../hooks/use-file-drag-target";
import styles from "./file-drop-zone.module.css";

export type FileDropZoneProps = {
  /** Passed to the native input; the zone itself never checks formats or limits. */
  accept?: string;
  className?: string;
  disabled?: boolean;
  hint?: ReactNode;
  label: string;
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
  variant?: FileDropZoneVariant;
};

/**
 * Picks files by drag and drop, click, keyboard or — on phones — gallery and camera. It only
 * hands over `File[]`; classification, limits and uploading belong to the consumer.
 */
export function FileDropZone({
  accept,
  className,
  disabled = false,
  hint,
  label,
  multiple = false,
  onFilesSelected,
  variant = FileDropZoneVariant.Large,
}: FileDropZoneProps) {
  const inputId = useId();
  const titleId = useId();
  const hintId = useId();

  function emit(files: File[]) {
    const selected = multiple ? files : files.slice(0, 1);
    if (selected.length > 0) onFilesSelected(selected);
  }

  const drag = useFileDragTarget(emit, disabled);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    // Clearing lets the same file be chosen again after a rejection or a cancelled upload.
    event.target.value = "";
    emit(files);
  }

  return (
    <div
      aria-describedby={hint ? hintId : undefined}
      aria-labelledby={titleId}
      className={className ? `${styles.zone} ${className}` : styles.zone}
      data-active={drag.active ? "true" : "false"}
      data-disabled={disabled ? "true" : "false"}
      data-variant={variant}
      role="group"
      {...drag.handlers}
    >
      <input
        accept={accept}
        aria-labelledby={titleId}
        aria-describedby={hint ? hintId : undefined}
        className={styles.input}
        disabled={disabled}
        id={inputId}
        multiple={multiple}
        onChange={handleChange}
        type="file"
      />
      <label className={styles.label} htmlFor={inputId}>
        <span aria-hidden="true" className={styles.icon}>
          <FontAwesomeIcon icon={faArrowUpFromBracket} />
        </span>
        <span className={styles.text}>
          <span className={styles.title} id={titleId}>
            {label}
          </span>
          {hint ? (
            <span className={styles.hint} id={hintId}>
              {hint}
            </span>
          ) : null}
        </span>
      </label>
    </div>
  );
}
