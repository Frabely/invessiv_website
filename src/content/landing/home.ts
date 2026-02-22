import type { SectionId } from "@/config/site";

export type LandingSection = {
  id: SectionId;
  eyebrow?: string;
  title: string;
  description: string;
};

export const HOME_SECTIONS: LandingSection[] = [
  {
    id: "hero",
    eyebrow: "Invessiv Upgrade",
    title: "Digitale Services mit klarer Journey und messbarer Wirkung.",
    description:
      "Phase 0 schafft eine belastbare Struktur fuer die vollstaendige Website statt isolierter Mockups.",
  },
  {
    id: "proof",
    title: "Proof-Section",
    description:
      "Diese Sektion ist als Platzhalter fuer Case Studies, Kennzahlen und vertrauensbildende Elemente vorbereitet.",
  },
  {
    id: "services",
    title: "Leistungen",
    description:
      "Leistungsbausteine werden modular als Content-Module und nicht als ungeordneter Freitext gepflegt.",
  },
  {
    id: "process",
    title: "Prozess",
    description:
      "Die Nutzerfuehrung bleibt linear: Orientierung, Auswahl, Anfrage und Nachverfolgung ohne Brueche.",
  },
  {
    id: "pricing",
    title: "Pakete",
    description:
      "Pakete und Umfang werden spaeter transparent und vergleichbar in standardisierten Komponenten dargestellt.",
  },
  {
    id: "contact",
    title: "Kontakt",
    description:
      "Der primaere Conversion-Pfad endet in einem klaren, kurzen Kontakt- bzw. Anfrageflow.",
  },
];
