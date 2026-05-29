import { useId } from "react";

export type GeneratorFieldIds = {
  topic: string;
  expertise: string;
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
    email: `${baseId}-email`,
    consent: `${baseId}-consent`,
    honeypot: `${baseId}-company`,
  };
}
