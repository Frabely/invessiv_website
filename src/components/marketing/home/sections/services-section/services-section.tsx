"use client";

import { useEffect, useMemo, useState } from "react";
import type { PointerEvent, RefObject } from "react";

import { SecondaryService } from "@/components/marketing/home/sections/services-section/secondary-service/secondary-service";
import { ServiceCard } from "@/components/marketing/home/sections/services-section/service-card/service-card";
import type { LandingSectionCopy } from "@/i18n/dictionaries/marketing/home";

import styles from "./services-section.module.css";

type ServiceCardData = NonNullable<LandingSectionCopy["serviceCards"]>[number];
type GoalOption = {
  key: string;
  label: string;
};

type ServicesSectionProps = {
  addonBadgeLabel: string;
  deliveryLabel: string;
  detailsCtaLabel: string;
  fitLabel: string;
  goalOptions: GoalOption[];
  goalTitle: string;
  id: string;
  moreItemsPluralLabel: string;
  moreItemsSingularLabel: string;
  primaryCtaLabel: string;
  primaryCtaLabels: Record<
    "landing" | "maintenance" | "process" | "upgrade" | "web",
    string
  >;
  recommendedBadgeLabel: string;
  sectionRef: RefObject<HTMLElement | null>;
  serviceCards: ServiceCardData[];
  serviceContextNote?: string;
  serviceSecondaryTitle?: string;
  title: string;
};

const PRIMARY_ORDER = ["web", "landing", "process"] as const;
const SECONDARY_ORDER = ["upgrade", "maintenance"] as const;
const DEFAULT_GOAL_KEY = "more_inquiries";
const GOAL_TO_SERVICE = {
  more_inquiries: "landing",
  professional_presence: "web",
  simplify_workflows: "process",
} as const;
export function ServicesSection({
  addonBadgeLabel,
  deliveryLabel,
  detailsCtaLabel,
  fitLabel,
  goalOptions,
  goalTitle,
  id,
  moreItemsPluralLabel,
  moreItemsSingularLabel,
  primaryCtaLabel,
  primaryCtaLabels,
  recommendedBadgeLabel,
  sectionRef,
  serviceCards,
  serviceContextNote,
  serviceSecondaryTitle,
  title,
}: ServicesSectionProps) {
  const [openCardKey, setOpenCardKey] = useState<string | null>(null);
  const [selectedGoalKey, setSelectedGoalKey] = useState<string>(
    goalOptions[0]?.key ?? DEFAULT_GOAL_KEY,
  );

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

  const recommendedCardKey =
    GOAL_TO_SERVICE[selectedGoalKey as keyof typeof GOAL_TO_SERVICE] ??
    "landing";

  const selectedGoal =
    goalOptions.find((option) => option.key === selectedGoalKey) ?? null;
  const selectedGoalLabel = selectedGoal?.label ?? "";

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("invessiv:project-offer-change", {
        detail: {
          offerKey: recommendedCardKey,
          projectGoal: selectedGoal?.label ?? "",
        },
      }),
    );
  }, [recommendedCardKey, selectedGoal?.label]);

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

  const selectGoal = (goalKey: string) => {
    setSelectedGoalKey(goalKey);
    setOpenCardKey(null);
  };

  const handlePrimaryCardSelection = () => undefined;

  const getSecondaryCtaLabel = (cardKey: ServiceCardData["key"]) =>
    primaryCtaLabels[cardKey as keyof typeof primaryCtaLabels] ||
    primaryCtaLabel;

  return (
    <section className={styles.section} id={id} ref={sectionRef}>
      <div className={styles.goalPicker} aria-label={goalTitle} role="group">
        <h2 className={styles.sectionTitle}>{title}</h2>
        <p className={styles.goalTitle}>{goalTitle}</p>
        <div className={styles.goalChips}>
          {goalOptions.map((option) => {
            const isActive = option.key === selectedGoalKey;

            return (
              <button
                aria-pressed={isActive}
                className={`${styles.goalChip}${isActive ? ` ${styles.goalChipActive}` : ""}`}
                key={option.key}
                onClick={() => selectGoal(option.key)}
                type="button"
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {serviceContextNote ? (
        <p className={styles.contextNote}>{serviceContextNote}</p>
      ) : null}

      <div className={styles.primaryGrid} role="list">
        {primaryCards.map((card) => (
          <ServiceCard
            card={card}
            cardClassName={styles.primaryCard}
            ctaLabel={primaryCtaLabel}
            isCtaActive={recommendedCardKey === card.key}
            ctaProjectGoal={selectedGoalLabel}
            defaultDeliveryLabel={deliveryLabel}
            detailsCtaLabel={detailsCtaLabel}
            fitLabel={fitLabel}
            isDetailsOpen={openCardKey === card.key}
            isMobilePriority={card.key === recommendedCardKey}
            isRecommended={card.key === recommendedCardKey}
            key={card.key}
            moreItemsPluralLabel={moreItemsPluralLabel}
            moreItemsSingularLabel={moreItemsSingularLabel}
            onCardSelectAction={handlePrimaryCardSelection}
            onDetailsToggleAction={(nextOpenState) =>
              toggleCardDetails(card.key, nextOpenState)
            }
            onPointerLeaveAction={resetCardSpotlight}
            onPointerMoveAction={setCardSpotlight}
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
              ctaLabel={getSecondaryCtaLabel(card.key)}
              ctaProjectGoal={selectedGoalLabel}
              defaultDeliveryLabel={deliveryLabel}
              key={card.key}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
