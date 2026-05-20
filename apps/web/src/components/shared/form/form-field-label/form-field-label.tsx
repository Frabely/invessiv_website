"use client";

import { FormRequiredMarker } from "@/components/shared/form/form-required-marker/form-required-marker";

type FormFieldLabelProps = {
  className?: string;
  label: string;
  required?: boolean;
};

export function FormFieldLabel({
  className,
  label,
  required = false,
}: FormFieldLabelProps) {
  return (
    <span className={className}>
      {label}
      {required ? (
        <>
          {" "}
          <FormRequiredMarker />
        </>
      ) : null}
    </span>
  );
}
