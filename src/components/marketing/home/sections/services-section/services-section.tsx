import { useState } from "react";
import type { PointerEvent, RefObject } from "react";

import type { LandingSectionCopy } from "@/i18n/dictionaries/marketing/home";
import { ServiceCard } from "@/components/marketing/home/sections/services-section/service-card";
import { SectionScanPoints } from "@/components/marketing/home/shared/section-scan-points/section-scan-points";

type ServiceCard = NonNullable<LandingSectionCopy["serviceCards"]>[number];

type ServicesSectionProps = {
  addonBadgeLabel: string;
  comingSoonExamplesCtaLabel: string;
  comingSoonExamplesHideLabel: string;
  comingSoonLabel: string;
  deliveryLabel: string;
  detailsCtaLabel: string;
  description: string;
  faqLinkLabel: string;
  id: string;
  moreItemsPluralLabel: string;
  moreItemsSingularLabel: string;
  oneTimeLabel: string;
  primaryCtaLabel: string;
  recommendedBadgeLabel: string;
  sectionRef: RefObject<HTMLElement | null>;
  serviceCards: ServiceCard[];
  summaryPoints?: string[];
  title: string;
};

export function ServicesSection({
  addonBadgeLabel,
  comingSoonExamplesCtaLabel,
  comingSoonExamplesHideLabel,
  comingSoonLabel,
  deliveryLabel,
  detailsCtaLabel,
  description,
  faqLinkLabel,
  id,
  moreItemsPluralLabel,
  moreItemsSingularLabel,
  oneTimeLabel,
  primaryCtaLabel,
  recommendedBadgeLabel,
  sectionRef,
  serviceCards,
  summaryPoints,
  title,
}: ServicesSectionProps) {
  const [openCardKey, setOpenCardKey] = useState<string | null>(null);

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

  const toggleCardDetails = (cardKey: string, nextOpenState: boolean) => {
    setOpenCardKey((currentOpenCardKey) => {
      if (nextOpenState) {
        return cardKey;
      }
      return currentOpenCardKey === cardKey ? null : currentOpenCardKey;
    });
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
              addonBadgeLabel={addonBadgeLabel}
              card={card}
              cardClassName={cardClassName}
              comingSoonExamplesCtaLabel={comingSoonExamplesCtaLabel}
              comingSoonExamplesHideLabel={comingSoonExamplesHideLabel}
              comingSoonLabel={comingSoonLabel}
              defaultDeliveryLabel={deliveryLabel}
              detailsCtaLabel={detailsCtaLabel}
              faqLinkLabel={faqLinkLabel}
              isDetailsOpen={openCardKey === card.key}
              key={card.key}
              moreItemsPluralLabel={moreItemsPluralLabel}
              moreItemsSingularLabel={moreItemsSingularLabel}
              onDetailsToggleAction={(nextOpenState) =>
                toggleCardDetails(card.key, nextOpenState)
              }
              onPointerLeave={resetCardSpotlight}
              onPointerMove={setCardSpotlight}
              oneTimeLabel={oneTimeLabel}
              primaryCtaLabel={primaryCtaLabel}
              recommendedBadgeLabel={recommendedBadgeLabel}
            />
          );
        })}
      </div>
    </section>
  );
}
