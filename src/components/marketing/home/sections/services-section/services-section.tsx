import type { PointerEvent, RefObject } from "react";

import type { LandingSectionCopy } from "@/i18n/dictionaries/marketing/home";
import { ServiceCard } from "@/components/marketing/home/sections/services-section/service-card";
import { SectionScanPoints } from "@/components/marketing/home/shared/section-scan-points/section-scan-points";

type ServiceCard = NonNullable<LandingSectionCopy["serviceCards"]>[number];

type ServicesSectionProps = {
  deliveryLabel: string;
  detailsCtaLabel: string;
  description: string;
  id: string;
  primaryCtaLabel: string;
  sectionRef: RefObject<HTMLElement | null>;
  serviceCards: ServiceCard[];
  summaryPoints?: string[];
  title: string;
};

export function ServicesSection({
  deliveryLabel,
  detailsCtaLabel,
  description,
  id,
  primaryCtaLabel,
  sectionRef,
  serviceCards,
  summaryPoints,
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
      <SectionScanPoints
        fallbackClassName="services-hint"
        fallbackText={description}
        points={summaryPoints}
      />

      <div className="services-bento" role="list">
        {serviceCards.map((card) => {
          const cardClassName = `services-card services-card--${card.key}${card.isRecommended ? " services-card--recommended" : ""}`;

          return (
            <ServiceCard
              card={card}
              cardClassName={cardClassName}
              defaultDeliveryLabel={deliveryLabel}
              detailsCtaLabel={detailsCtaLabel}
              key={card.key}
              onPointerLeave={resetCardSpotlight}
              onPointerMove={setCardSpotlight}
              primaryCtaLabel={primaryCtaLabel}
            />
          );
        })}
      </div>
    </section>
  );
}
