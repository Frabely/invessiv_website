"use client";

import { useSectionScrollFade } from "@/hooks/marketing/use-section-scroll-fade";

type SectionScrollFadeProps = {
  sectionIds: readonly string[];
};

export function SectionScrollFade({ sectionIds }: SectionScrollFadeProps) {
  useSectionScrollFade(sectionIds);

  return null;
}
