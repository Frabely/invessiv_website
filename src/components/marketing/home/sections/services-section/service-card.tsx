"use client";

import { useRef } from "react";
import type { KeyboardEvent, MouseEvent, PointerEvent } from "react";

import type { LandingSectionCopy } from "@/i18n/dictionaries/marketing/home";
import { ServiceCardIcon } from "@/components/marketing/home/sections/services-section/service-card-icon";

type ServiceCardCopy = NonNullable<LandingSectionCopy["serviceCards"]>[number];

type ServiceCardProps = {
  addonBadgeLabel: string;
  card: ServiceCardCopy;
  cardClassName: string;
  comingSoonExamplesCtaLabel: string;
  comingSoonExamplesHideLabel: string;
  comingSoonLabel: string;
  defaultDeliveryLabel: string;
  detailsCtaLabel: string;
  faqLinkLabel: string;
  fitLabel: string;
  isDetailsOpen: boolean;
  moreItemsPluralLabel: string;
  moreItemsSingularLabel: string;
  onDetailsToggleAction: (nextOpenState: boolean) => void;
  onPointerLeave: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  oneTimeLabel: string;
  primaryCtaLabel: string;
  recommendedBadgeLabel: string;
};

export function ServiceCard({
  addonBadgeLabel,
  card,
  cardClassName,
  comingSoonExamplesCtaLabel,
  comingSoonExamplesHideLabel,
  comingSoonLabel,
  defaultDeliveryLabel,
  detailsCtaLabel,
  faqLinkLabel,
  fitLabel,
  isDetailsOpen,
  moreItemsPluralLabel,
  moreItemsSingularLabel,
  onDetailsToggleAction,
  onPointerLeave,
  onPointerMove,
  oneTimeLabel,
  primaryCtaLabel,
  recommendedBadgeLabel,
}: ServiceCardProps) {
  const detailsId = `services-details-${card.key}`;
  const detailsButtonRef = useRef<HTMLButtonElement | null>(null);
  const isComingSoon = card.isComingSoon === true;

  const handleCardKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Escape" || !isDetailsOpen) {
      return;
    }
    onDetailsToggleAction(false);
    detailsButtonRef.current?.focus();
  };

  if (isComingSoon) {
    const comingSoonExamples = card.comingSoonExamples ?? [];
    const hasComingSoonExamples = comingSoonExamples.length > 0;
    const resolvedCardClassName = hasComingSoonExamples
      ? `${cardClassName} services-card--expandable`
      : cardClassName;
    const resolvedStateClassName = `${resolvedCardClassName} services-card--coming-soon`;
    const handleComingSoonClick = (event: MouseEvent<HTMLElement>) => {
      if (!hasComingSoonExamples) {
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
      <article
        className={resolvedStateClassName}
        onClick={handleComingSoonClick}
        onKeyDown={handleCardKeyDown}
        onPointerLeave={onPointerLeave}
        onPointerMove={onPointerMove}
        role="listitem"
      >
        <div aria-hidden="true" className="services-coming-soon-shell">
          <span className="services-coming-soon-ghost services-coming-soon-ghost--hero" />
          <span className="services-coming-soon-ghost services-coming-soon-ghost--line" />
          <span className="services-coming-soon-ghost services-coming-soon-ghost--line services-coming-soon-ghost--line-wide" />
          <span className="services-coming-soon-ghost services-coming-soon-ghost--stack" />
        </div>

        <div className="services-coming-soon-overlay">
          <span className="services-coming-soon-pill">{comingSoonLabel}</span>

          <h3 className="services-coming-soon-title">
            <ServiceCardIcon iconAlt={card.iconAlt} iconSrc={card.iconSrc} />
            <span>{card.title}</span>
          </h3>

          <p className="services-coming-soon-copy">{card.description}</p>

          {hasComingSoonExamples ? (
            <>
              <div className="services-coming-soon-actions">
                <button
                  aria-controls={isDetailsOpen ? detailsId : undefined}
                  aria-expanded={isDetailsOpen}
                  className="services-details-toggle services-coming-soon-toggle"
                  onClick={() => onDetailsToggleAction(!isDetailsOpen)}
                  ref={detailsButtonRef}
                  type="button"
                >
                  {isDetailsOpen
                    ? comingSoonExamplesHideLabel
                    : comingSoonExamplesCtaLabel}
                  <span aria-hidden="true">&rsaquo;</span>
                </button>
              </div>

              {isDetailsOpen ? (
                <div className="services-coming-soon-examples" id={detailsId}>
                  <ul className="services-coming-soon-example-list">
                    {comingSoonExamples.map((example) => (
                      <li key={example}>{example}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </article>
    );
  }

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

  const badgeLabel = card.isRecommended
    ? recommendedBadgeLabel
    : card.key === "maintenance"
      ? addonBadgeLabel
      : null;

  const resolvedCardClassName = hasExpandableContent
    ? `${cardClassName} services-card--expandable`
    : cardClassName;
  const handleCardClick = (event: MouseEvent<HTMLElement>) => {
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
    <article
      className={resolvedCardClassName}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      onPointerLeave={onPointerLeave}
      onPointerMove={onPointerMove}
      role="listitem"
    >
      <div className="services-card-top">
        <div className="services-card-row">
          <div className="services-title-wrap">
            <div className="services-title-row">
              <h3 className="services-title">
                <ServiceCardIcon
                  iconAlt={card.iconAlt}
                  iconSrc={card.iconSrc}
                />
                <span>{card.title}</span>
              </h3>
              {badgeLabel ? (
                <span
                  className={`services-title-badge${card.isRecommended ? " services-title-badge--recommended" : ""}`}
                >
                  {badgeLabel}
                </span>
              ) : null}
            </div>

            {card.fit ? (
              <p className="services-fit-note">
                <span className="services-fit-label">{fitLabel}</span>
                <span>{card.fit}</span>
              </p>
            ) : null}
          </div>
        </div>

        <p className="services-price-row">
          <span className="services-price">{heroPrice}</span>
          {priceMeta ? (
            <span className="services-price-meta">{priceMeta}</span>
          ) : null}
        </p>

        <p className="services-delivery-badge">
          {deliveryLabel}: {card.delivery}
        </p>

        <div className="services-bullets-stack">
          <ul className="services-list">
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
              className="services-details-content"
              hidden={!isDetailsOpen}
              id={detailsId}
            >
              {detailsItems.length ? (
                <ul className="services-details-list services-details-list--notes">
                  {detailsItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>

        {hiddenItemsCount > 0 && hasExpandableContent && !isDetailsOpen ? (
          <p className="services-more-items">
            + {hiddenItemsCount} {hiddenBulletsLabel}
          </p>
        ) : null}

        {hasExpandableContent ? (
          <div className="services-card-actions-row">
            {isDetailsOpen ? (
              <div className="services-details-actions">
                <a
                  className="btn btn--primary services-details-cta"
                  data-project-offer={card.key}
                  href="#contact"
                  data-analytics-event="cta_click"
                  data-analytics-location="pricing"
                  data-analytics-variant="primary"
                  data-analytics-target="form"
                >
                  {primaryCtaLabel}
                </a>
                <a className="services-details-link" href="#faq">
                  {faqLinkLabel}
                </a>
              </div>
            ) : (
              <span
                aria-hidden="true"
                className="services-details-actions-spacer"
              />
            )}
            <div className="services-details-toggle-wrap">
              <button
                aria-controls={detailsId}
                aria-expanded={isDetailsOpen}
                className="services-details-toggle"
                onClick={() => onDetailsToggleAction(!isDetailsOpen)}
                ref={detailsButtonRef}
                type="button"
              >
                {detailsCtaLabel}
                <span aria-hidden="true">&rsaquo;</span>
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}
