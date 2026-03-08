"use client";

import { useEffect } from "react";
import type { RefObject } from "react";

export function useServicesCardReveal(
  sectionRef: RefObject<HTMLElement | null>,
  locale: string,
) {
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) {
      return;
    }

    const cards = Array.from(
      section.querySelectorAll<HTMLElement>(".services-card"),
    );
    cards.forEach((card, index) => {
      card.style.setProperty("--services-reveal-delay", `${index * 75}ms`);
      card.classList.add("is-visible");
    });
  }, [locale, sectionRef]);
}
