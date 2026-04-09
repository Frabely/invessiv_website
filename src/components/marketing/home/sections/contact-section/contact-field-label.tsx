"use client";

import { ContactRequiredMarker } from "@/components/marketing/home/sections/contact-section/contact-required-marker";

type ContactFieldLabelProps = {
  label: string;
  required?: boolean;
};

export function ContactFieldLabel({
  label,
  required = false,
}: ContactFieldLabelProps) {
  return (
    <span>
      {label}
      {required ? <ContactRequiredMarker /> : null}
    </span>
  );
}
