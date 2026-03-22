"use client";

import { useMemo, useState } from "react";
import type { PointerEvent, RefObject } from "react";

import { SecondaryService } from "@/components/marketing/home/sections/services-section/secondary-service/secondary-service";
import { ServiceCard } from "@/components/marketing/home/sections/services-section/service-card/service-card";
import { SectionScanPoints } from "@/components/marketing/home/shared/section-scan-points/section-scan-points";
import type { LandingSectionCopy } from "@/i18n/dictionaries/marketing/home";

import styles from "./services-section.module.css";

type ServiceCardData = NonNullable<LandingSectionCopy["serviceCards"]>[number];

type ServicesSectionProps = {
  addonBadgeLabel: string;
  deliveryLabel: string;
  detailsCtaLabel: string;
  description: string;
  fitLabel: string;
  id: string;
  moreItemsPluralLabel: string;
  moreItemsSingularLabel: string;
  oneTimeLabel: string;
  primaryCtaLabel: string;
  recommendedBadgeLabel: string;
  sectionRef: RefObject<HTMLElement | null>;
  serviceCards: ServiceCardData[];
  serviceSecondaryTitle?: string;
  summaryPoints?: string[];
  title: string;
};

const PRIMARY_ORDER = ["web", "landing", "process"] as const;
const SECONDARY_ORDER = ["upgrade", "maintenance"] as const;

export function ServicesSection({
  addonBadgeLabel,
  deliveryLabel,
  detailsCtaLabel,
  description,
  fitLabel,
  id,
  moreItemsPluralLabel,
  moreItemsSingularLabel,
  oneTimeLabel,
  primaryCtaLabel,
  recommendedBadgeLabel,
  sectionRef,
  serviceCards,
  serviceSecondaryTitle,
  summaryPoints,
  title,
}: ServicesSectionProps) {
  const [openCardKey, setOpenCardKey] = useState<string | null>(null);

  const primaryCards = useMemo(
    () =>
      PRIMARY_ORDER.map((key) =>
        serviceCards.find((card) => card.key === key),
      ).filter((card): card is ServiceCardData => Boolean(card)),
    [serviceCards],
  );

  const secondaryCards = useMemo(
    () =>
      SECONDARY_ORDER.map((key) =>
        serviceCards.find((card) => card.key === key),
      ).filter((card): card is ServiceCardData => Boolean(card)),
    [serviceCards],
  );

  const defaultSelectedCardKey = useMemo(
    () =>
      primaryCards.find((card) => card.key === "landing")?.key ??
      primaryCards[0]?.key ??
      secondaryCards[0]?.key ??
      null,
    [primaryCards, secondaryCards],
  );

  const [selectedCardKey, setSelectedCardKey] = useState<string | null>(
    defaultSelectedCardKey,
  );

  const selectedCard =
    serviceCards.find((card) => card.key === selectedCardKey) ??
    serviceCards.find((card) => card.key === defaultSelectedCardKey) ??
    null;

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
    <section
      className={`${styles.section} services-section`}
      id={id}
      ref={sectionRef}
    >
      <div className={styles.primaryHeader}>
        <h2>{title}</h2>
        <SectionScanPoints
          fallbackClassName="services-hint"
          fallbackText={description}
          points={summaryPoints}
        />
      </div>

      <div className={styles.primaryGrid} role="list">
        {primaryCards.map((card) => (
          <ServiceCard
            card={card}
            cardClassName={styles.primaryCard}
            defaultDeliveryLabel={deliveryLabel}
            detailsCtaLabel={detailsCtaLabel}
            fitLabel={fitLabel}
            isDetailsOpen={openCardKey === card.key}
            key={card.key}
            moreItemsPluralLabel={moreItemsPluralLabel}
            moreItemsSingularLabel={moreItemsSingularLabel}
            onCardSelectAction={() => setSelectedCardKey(card.key)}
            onDetailsToggleAction={(nextOpenState) =>
              toggleCardDetails(card.key, nextOpenState)
            }
            onPointerLeave={resetCardSpotlight}
            onPointerMove={setCardSpotlight}
            oneTimeLabel={oneTimeLabel}
            recommendedBadgeLabel={recommendedBadgeLabel}
          />
        ))}
      </div>

      <div className={styles.secondaryBlock}>
        {serviceSecondaryTitle ? (
          <h3 className={styles.secondaryTitle}>{serviceSecondaryTitle}</h3>
        ) : null}

        <div className={styles.secondaryGrid} role="list">
          {secondaryCards.map((card) => (
            <SecondaryService
              addonBadgeLabel={addonBadgeLabel}
              card={card}
              defaultDeliveryLabel={deliveryLabel}
              isSelected={selectedCardKey === card.key}
              key={card.key}
              onSelectAction={() => setSelectedCardKey(card.key)}
            />
          ))}
        </div>
      </div>

      {selectedCard ? (
        <div className={styles.sharedCta}>
          <a
            className={`btn btn--primary ${styles.sharedCtaButton}`}
            data-analytics-event="cta_click"
            data-analytics-location="pricing"
            data-analytics-target="form"
            data-analytics-variant="primary"
            data-project-offer={selectedCard.key}
            href="#contact"
          >
            {primaryCtaLabel}
          </a>
        </div>
      ) : null}
    </section>
  );
}
