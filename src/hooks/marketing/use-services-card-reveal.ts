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

    section.classList.add("services-section--reveal-enabled");

    const cards = Array.from(
      section.querySelectorAll<HTMLElement>(".services-card"),
    );
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    cards.forEach((card, index) => {
      card.classList.remove("is-visible");
      card.style.setProperty("--services-reveal-delay", `${index * 75}ms`);
    });

    if (reducedMotion) {
      cards.forEach((card) => card.classList.add("is-visible"));
      return () => {
        section.classList.remove("services-section--reveal-enabled");
      };
    }

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries, currentObserver) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              (entry.target as HTMLElement).classList.add("is-visible");
              currentObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.22, rootMargin: "0px 0px -8% 0px" },
      );

      cards.forEach((card) => observer.observe(card));

      return () => {
        observer.disconnect();
        section.classList.remove("services-section--reveal-enabled");
      };
    }

    cards.forEach((card) => card.classList.add("is-visible"));
    return () => {
      section.classList.remove("services-section--reveal-enabled");
    };
  }, [locale, sectionRef]);
}
