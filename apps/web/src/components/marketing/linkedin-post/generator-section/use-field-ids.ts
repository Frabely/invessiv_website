import { useId } from "react";

export type GeneratorFieldIds = {
  topic: string;
  expertise: string;
  tone: string;
  colorPair: string;
  displayName: string;
  email: string;
  consent: string;
  honeypot: string;
};

/** Stable, unique ids for the generator form fields (label/aria wiring). */
export function useFieldIds(): GeneratorFieldIds {
  const baseId = useId();
  return {
    topic: `${baseId}-topic`,
    expertise: `${baseId}-expertise`,
    tone: `${baseId}-tone`,
    colorPair: `${baseId}-color-pair`,
    displayName: `${baseId}-display-name`,
    email: `${baseId}-email`,
    consent: `${baseId}-consent`,
    honeypot: `${baseId}-company`,
  };
}
