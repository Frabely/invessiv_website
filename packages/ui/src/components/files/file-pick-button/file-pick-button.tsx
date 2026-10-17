"use client";

import { type ReactNode, useRef } from "react";
import {
  ButtonVariant,
  type ButtonVariant as ButtonVariantValue,
} from "@invessiv/common/constants/ui/button-variants";
import { ButtonControl } from "../../button/button";
import { useFilePicker } from "../../../hooks/use-file-picker";

export type FilePickButtonProps = {
  /** Passed to the native input; the button itself never checks formats or limits. */
  accept?: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
  variant?: ButtonVariantValue;
};

/**
 * A button that opens the file picker — on phones the gallery, camera or files — in one tap. It only
 * hands over `File[]`, like `FileDropZone`, for places where a drop zone has no room.
 */
export function FilePickButton({
  accept,
  children,
  className,
  disabled = false,
  multiple = false,
  onFilesSelected,
  variant = ButtonVariant.Primary,
}: FilePickButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { handleChange } = useFilePicker(onFilesSelected, multiple);

  return (
    <>
      <ButtonControl
        className={className}
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        type="button"
        variant={variant}
      >
        {children}
      </ButtonControl>
      <input
        accept={accept}
        aria-hidden="true"
        disabled={disabled}
        hidden
        multiple={multiple}
        onChange={handleChange}
        ref={inputRef}
        tabIndex={-1}
        type="file"
      />
    </>
  );
}
