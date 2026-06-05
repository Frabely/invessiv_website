import { useId } from "react";

export type GeneratorFieldIds = {
  topic: string;
  expertise: string;
  tone: string;
  colorPair: string;
  honeypot: string;
};

/** Stable, unique ids for the anonymous generator form fields (label/aria wiring). */
export function useGeneratorFieldIds(): GeneratorFieldIds {
  const baseId = useId();
  return {
    topic: `${baseId}-topic`,
    expertise: `${baseId}-expertise`,
    tone: `${baseId}-tone`,
    colorPair: `${baseId}-color-pair`,
    honeypot: `${baseId}-company`,
  };
}
