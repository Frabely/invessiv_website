import type { PointerEvent, RefObject } from "react";

import type { LandingSectionCopy } from "@/content/landing/home";
import { ServiceCard } from "@/components/marketing/home/sections/services-section/service-card";

type ServiceCard = NonNullable<LandingSectionCopy["serviceCards"]>[number];

type ServicesSectionProps = {
  description: string;
  id: string;
  sectionRef: RefObject<HTMLElement | null>;
  servicesExampleCta: string;
  serviceCards: ServiceCard[];
  title: string;
};

export function ServicesSection({
  description,
  id,
  sectionRef,
  serviceCards,
  servicesExampleCta,
  title,
}: ServicesSectionProps) {
  const setCardSpotlight = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse") {
      return;
    }
    const card = event.currentTarget;
    const bounds = card.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;

    card.style.setProperty("--services-spotlight-x", `${x}px`);
    card.style.setProperty("--services-spotlight-y", `${y}px`);
  };

  const resetCardSpotlight = (event: PointerEvent<HTMLElement>) => {
    event.currentTarget.style.removeProperty("--services-spotlight-x");
    event.currentTarget.style.removeProperty("--services-spotlight-y");
  };

  return (
    <section className="services-section" id={id} ref={sectionRef}>
      <h2>{title}</h2>
      <p className="services-hint">{description}</p>

      <div className="services-bento" role="list">
        {serviceCards.map((card) => {
          const isVisual = Boolean(card.visual);
          const spanClassName =
            card.span === 4
              ? "services-span-4"
              : card.span === 6
                ? "services-span-6"
                : isVisual
                  ? "services-span-7"
                  : "services-span-5";
          const cardClassName = `services-card ${isVisual ? "services-card--visual" : ""} ${spanClassName}`;

          return (
            <ServiceCard
              card={card}
              cardClassName={cardClassName}
              key={card.title}
              onPointerLeave={resetCardSpotlight}
              onPointerMove={setCardSpotlight}
              servicesExampleCta={servicesExampleCta}
            />
          );
        })}
      </div>
    </section>
  );
}
