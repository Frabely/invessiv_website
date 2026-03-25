"use client";

import { useRef } from "react";
import type { KeyboardEvent, MouseEvent, PointerEvent } from "react";

import { ServiceCardIcon } from "@/components/marketing/home/sections/services-section/service-card-icon";
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
  const hiddenBulletsCount = hiddenBullets.length;
  const hiddenDetailsCount = detailsItems.length;
  const hiddenItemsCount = hiddenBulletsCount + hiddenDetailsCount;
  const hasExpandableContent = hiddenBulletsCount > 0 || hiddenDetailsCount > 0;
  const hiddenBulletsLabel =
    hiddenItemsCount === 1 ? moreItemsSingularLabel : moreItemsPluralLabel;
  const deliveryLabel = card.deliveryLabel ?? defaultDeliveryLabel;
  const showPrimaryCta = isCtaActive || isDetailsOpen;

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
        className={`${styles.card} services-card${hasExpandableContent ? " services-card--expandable" : ""}${isRecommended ? ` ${styles.cardRecommended}` : ""}${cardClassName ? ` ${cardClassName}` : ""}`}
        data-service-card="true"
        data-visible="false"
        onClick={handleCardClick}
        onKeyDown={handleCardKeyDown}
        onPointerLeave={onPointerLeave}
        onPointerMove={onPointerMove}
      >
        <div className={`${styles.surface} services-card-top`}>
          <div className={styles.header}>
            <div className={`${styles.titleWrap} services-title-wrap`}>
              <div className={`${styles.titleRow} services-title-row`}>
                <h3 className={`${styles.title} services-title`}>
                  <ServiceCardIcon
                    iconAlt={card.iconAlt}
                    iconSrc={card.iconSrc}
                  />
                  <span>{card.title}</span>
                </h3>
                {isRecommended ? (
                  <span
                    className={`${styles.badge} services-title-badge services-title-badge--recommended`}
                  >
                    {recommendedBadgeLabel}
                  </span>
                ) : null}
              </div>

              {card.fit ? (
                <p className={`${styles.fitNote} services-fit-note`}>
                  <span className={`${styles.fitLabel} services-fit-label`}>
                    {fitLabel}
                  </span>
                  <span>{card.fit}</span>
                </p>
              ) : null}
            </div>

            <div className={styles.metaStack}>
              <p className={styles.highlight}>
                <span className={styles.highlightText}>{card.highlight}</span>
              </p>
              <div className={styles.metaInfo}>
                <p
                  className={`${styles.deliveryBadge} services-delivery-badge`}
                >
                  {deliveryLabel}: {card.delivery}
                </p>
                <p className={styles.pricingHint}>{card.pricingHint}</p>
              </div>
            </div>
          </div>

          <div className={styles.body}>
            <ul className={`${styles.list} services-list`}>
              {visibleBullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
              {isDetailsOpen
                ? hiddenBullets.map((item) => <li key={item}>{item}</li>)
                : null}
            </ul>

            {hasExpandableContent &&
            (detailsItems.length > 0 || isDetailsOpen) ? (
              <div
                className={`${styles.details} services-details-content`}
                hidden={!isDetailsOpen}
                id={detailsId}
              >
                {detailsItems.length ? (
                  <ul
                    className={`${styles.notes} services-details-list services-details-list--notes`}
                  >
                    {detailsItems.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </div>

          {hiddenItemsCount > 0 && hasExpandableContent ? (
            <p
              aria-hidden={isDetailsOpen ? "true" : undefined}
              className={`${styles.moreItems} services-more-items${isDetailsOpen ? ` ${styles.moreItemsPlaceholder}` : ""}`}
            >
              + {hiddenItemsCount} {hiddenBulletsLabel}
            </p>
          ) : null}

          <div className={`${styles.footer} services-card-actions-row`}>
            <div className={`${styles.actions} services-details-actions`}>
              {showPrimaryCta ? (
                <a
                  className={`btn btn--primary services-details-cta ${styles.primaryCta}`}
                  data-analytics-event="cta_click"
                  data-analytics-location="pricing"
                  data-analytics-target="form"
                  data-analytics-variant="primary"
                  data-project-goal={ctaProjectGoal}
                  data-project-offer={card.key}
                  href={SECTION_HREFS.contact}
                >
                  {ctaLabel}
                </a>
              ) : (
                <span
                  aria-hidden="true"
                  className={`btn btn--primary services-details-cta ${styles.primaryCta} ${styles.primaryCtaPlaceholder}`}
                >
                  {ctaLabel}
                </span>
              )}
            </div>

            <div
              className={`${styles.footerMeta} services-details-toggle-wrap`}
            >
              {hasExpandableContent ? (
                <button
                  aria-controls={detailsId}
                  aria-expanded={isDetailsOpen}
                  className={`${styles.toggle} services-details-toggle`}
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
