"use client";

import { useRef } from "react";
import type { KeyboardEvent, MouseEvent, PointerEvent } from "react";

import { ServiceCardIcon } from "@/components/marketing/home/sections/services-section/service-card-icon";
import { PrimaryCtaLink } from "@/components/shared/button/button";
import buttonStyles from "@/components/shared/button/button.module.css";
import { SECTION_HREFS } from "@/config/site";
import type { LandingSectionCopy } from "@/i18n/dictionaries/marketing/home";

import styles from "./service-card.module.css";

type ServiceCardCopy = NonNullable<LandingSectionCopy["serviceCards"]>[number];

type ServiceCardProps = {
  card: ServiceCardCopy;
  cardClassName?: string;
  ctaLabel: string;
  isCtaActive?: boolean;
  ctaProjectGoal?: string;
  defaultDeliveryLabel: string;
  detailsCtaLabel: string;
  fitLabel: string;
  isDetailsOpen: boolean;
  isMobilePriority?: boolean;
  isRecommended?: boolean;
  moreItemsPluralLabel: string;
  moreItemsSingularLabel: string;
  onCardSelectAction: () => void;
  onDetailsToggleAction: (nextOpenState: boolean) => void;
  onPointerLeave: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  recommendedBadgeLabel: string;
};

export function ServiceCard({
  card,
  cardClassName,
  ctaLabel,
  isCtaActive = false,
  ctaProjectGoal = "",
  defaultDeliveryLabel,
  detailsCtaLabel,
  fitLabel,
  isDetailsOpen,
  isMobilePriority = false,
  isRecommended = false,
  moreItemsPluralLabel,
  moreItemsSingularLabel,
  onCardSelectAction,
  onDetailsToggleAction,
  onPointerLeave,
  onPointerMove,
  recommendedBadgeLabel,
}: ServiceCardProps) {
  const detailsId = `services-details-${card.key}`;
  const detailsButtonRef = useRef<HTMLButtonElement | null>(null);
  const detailsItems = card.details ?? [];
  const visibleBullets = card.included.slice(0, 3);
  const hiddenBullets = card.included.slice(3);
  const expandedBullets = [...hiddenBullets, ...detailsItems];
  const hiddenBulletsCount = hiddenBullets.length;
  const hiddenDetailsCount = detailsItems.length;
  const hiddenItemsCount = hiddenBulletsCount + hiddenDetailsCount;
  const hasExpandableContent = hiddenBulletsCount > 0 || hiddenDetailsCount > 0;
  const hiddenBulletsLabel =
    hiddenItemsCount === 1 ? moreItemsSingularLabel : moreItemsPluralLabel;
  const deliveryLabel = card.deliveryLabel ?? defaultDeliveryLabel;
  const showPrimaryCta = isCtaActive || isDetailsOpen;
  const cardClasses = [
    styles.card,
    hasExpandableContent ? styles.cardExpandable : "",
    isRecommended ? styles.cardRecommended : "",
    cardClassName ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  const moreItemsClasses = [
    styles.moreItems,
    isDetailsOpen ? styles.moreItemsPlaceholder : "",
  ]
    .filter(Boolean)
    .join(" ");
  const placeholderCtaClasses = [
    buttonStyles.button,
    buttonStyles.primary,
    styles.primaryCta,
    styles.primaryCtaPlaceholder,
  ]
    .filter(Boolean)
    .join(" ");

  const handleCardKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Escape" || !isDetailsOpen) {
      return;
    }

    onDetailsToggleAction(false);
    detailsButtonRef.current?.focus();
  };

  const handleCardClick = (event: MouseEvent<HTMLElement>) => {
    onCardSelectAction();

    if (!hasExpandableContent) {
      return;
    }

    const target = event.target;
    if (
      target instanceof Element &&
      target.closest("button, a, input, select, textarea, summary")
    ) {
      return;
    }

    onDetailsToggleAction(!isDetailsOpen);
  };

  return (
    <div
      className={styles.shell}
      data-card-key={card.key}
      data-mobile-priority={isMobilePriority ? "top" : "default"}
      data-service-variant="primary"
      role="listitem"
    >
      <article
        aria-label={card.title}
        className={cardClasses}
        data-service-card="true"
        data-visible="false"
        onClick={handleCardClick}
        onKeyDown={handleCardKeyDown}
        onPointerLeave={onPointerLeave}
        onPointerMove={onPointerMove}
      >
        <div className={styles.surface}>
          <div className={styles.header}>
            <div className={styles.titleWrap}>
              <div className={styles.titleRow}>
                <h3 className={styles.title}>
                  <ServiceCardIcon
                    iconAlt={card.iconAlt}
                    iconSrc={card.iconSrc}
                  />
                  <span>{card.title}</span>
                </h3>
                {isRecommended ? (
                  <span className={styles.badge}>{recommendedBadgeLabel}</span>
                ) : null}
              </div>

              {card.fit ? (
                <p className={styles.fitNote}>
                  <span className={styles.fitLabel}>{fitLabel}</span>
                  <span>{card.fit}</span>
                </p>
              ) : null}
            </div>

            <div className={styles.metaStack}>
              <p className={styles.highlight}>
                <span className={styles.highlightText}>{card.highlight}</span>
              </p>
              <div className={styles.metaInfo}>
                <p className={styles.deliveryBadge}>
                  {deliveryLabel}: {card.delivery}
                </p>
                <p className={styles.pricingHint}>{card.pricingHint}</p>
              </div>
            </div>
          </div>

          <div className={styles.body}>
            <ul className={styles.list}>
              {visibleBullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
              {isDetailsOpen
                ? expandedBullets.map((item) => <li key={item}>{item}</li>)
                : null}
            </ul>

            {hasExpandableContent ? (
              <div
                className={styles.details}
                hidden={!isDetailsOpen}
                id={detailsId}
              />
            ) : null}
          </div>

          {hiddenItemsCount > 0 && hasExpandableContent ? (
            <p
              aria-hidden={isDetailsOpen ? "true" : undefined}
              className={moreItemsClasses}
            >
              + {hiddenItemsCount} {hiddenBulletsLabel}
            </p>
          ) : null}

          <div className={styles.footer}>
            <div className={styles.actions}>
              {showPrimaryCta ? (
                <PrimaryCtaLink
                  className={styles.primaryCta}
                  data-analytics-event="cta_click"
                  data-analytics-location="pricing"
                  data-analytics-target="form"
                  data-analytics-variant="primary"
                  data-project-goal={ctaProjectGoal}
                  data-project-offer={card.key}
                  href={SECTION_HREFS.contact}
                >
                  {ctaLabel}
                </PrimaryCtaLink>
              ) : (
                <span aria-hidden="true" className={placeholderCtaClasses}>
                  {ctaLabel}
                </span>
              )}
            </div>

            <div className={styles.footerMeta}>
              {hasExpandableContent ? (
                <button
                  aria-controls={detailsId}
                  aria-expanded={isDetailsOpen}
                  className={styles.toggle}
                  onClick={() => {
                    onCardSelectAction();
                    onDetailsToggleAction(!isDetailsOpen);
                  }}
                  ref={detailsButtonRef}
                  type="button"
                >
                  {detailsCtaLabel}
                  <span aria-hidden="true" className={styles.toggleArrow}>
                    &rsaquo;
                  </span>
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
