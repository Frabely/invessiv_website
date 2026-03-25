"use client";

import { useRef } from "react";
import type { KeyboardEvent, MouseEvent, PointerEvent } from "react";

import { ServiceCardIcon } from "@/components/marketing/home/sections/services-section/service-card-icon";
import type { LandingSectionCopy } from "@/i18n/dictionaries/marketing/home";

import styles from "./service-card.module.css";

type ServiceCardCopy = NonNullable<LandingSectionCopy["serviceCards"]>[number];

type ServiceCardProps = {
  card: ServiceCardCopy;
  cardClassName?: string;
  ctaLabel?: string;
  isCtaActive?: boolean;
  ctaProjectGoal?: string;
  defaultDeliveryLabel: string;
  detailsCtaLabel: string;
  fitLabel: string;
  isDetailsOpen: boolean;
  isRecommended?: boolean;
  moreItemsPluralLabel: string;
  moreItemsSingularLabel: string;
  onCardSelectAction: () => void;
  onDetailsToggleAction: (nextOpenState: boolean) => void;
  onPointerLeave: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  oneTimeLabel: string;
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
  isRecommended = false,
  moreItemsPluralLabel,
  moreItemsSingularLabel,
  onCardSelectAction,
  onDetailsToggleAction,
  onPointerLeave,
  onPointerMove,
  oneTimeLabel,
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
  const normalizedPrice = card.price.trim();
  const isHourlyPrice = /\/\s*h\b/i.test(normalizedPrice);
  const heroPrice = normalizedPrice
    .replace(/\s*(einmalig|one-time)\s*$/i, "")
    .trim();
  const priceMeta = isHourlyPrice ? null : oneTimeLabel;

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
              <p className={`${styles.priceRow} services-price-row`}>
                <span className={`${styles.price} services-price`}>
                  {heroPrice}
                </span>
                {priceMeta ? (
                  <span className={`${styles.priceMeta} services-price-meta`}>
                    {oneTimeLabel}
                  </span>
                ) : null}
              </p>
              <p className={`${styles.deliveryBadge} services-delivery-badge`}>
                {deliveryLabel}: {card.delivery}
              </p>
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

          {hiddenItemsCount > 0 && hasExpandableContent && !isDetailsOpen ? (
            <p className={`${styles.moreItems} services-more-items`}>
              + {hiddenItemsCount} {hiddenBulletsLabel}
            </p>
          ) : null}

          <div className={`${styles.footer} services-card-actions-row`}>
            <div className={`${styles.actions} services-details-actions`}>
              {ctaLabel && isCtaActive ? (
                <a
                  className={`btn btn--primary services-details-cta ${styles.primaryCta}`}
                  data-analytics-event="cta_click"
                  data-analytics-location="pricing"
                  data-analytics-target="form"
                  data-analytics-variant="primary"
                  data-project-goal={ctaProjectGoal}
                  data-project-offer={card.key}
                  href="#contact"
                >
                  {ctaLabel}
                </a>
              ) : ctaLabel ? (
                <span
                  aria-hidden="true"
                  className={`btn btn--primary services-details-cta ${styles.primaryCta} ${styles.primaryCtaPlaceholder}`}
                >
                  {ctaLabel}
                </span>
              ) : (
                <span
                  aria-hidden="true"
                  className={`${styles.actionsSpacer} services-details-actions-spacer`}
                />
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
