"use client";

import { useId, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";

import type { LandingSectionCopy } from "@/content/landing/home";
import { ServiceCardIcon } from "@/components/marketing/home/sections/services-section/service-card-icon";

type ServiceCardCopy = NonNullable<LandingSectionCopy["serviceCards"]>[number];

type ServiceCardProps = {
  card: ServiceCardCopy;
  cardClassName: string;
  defaultDeliveryLabel: string;
  detailsCtaLabel: string;
  onPointerLeave: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  primaryCtaLabel: string;
};

export function ServiceCard({
  card,
  cardClassName,
  defaultDeliveryLabel,
  detailsCtaLabel,
  onPointerLeave,
  onPointerMove,
  primaryCtaLabel,
}: ServiceCardProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const detailsId = useId();
  const detailsButtonRef = useRef<HTMLButtonElement | null>(null);

  const detailsItems = card.details ?? [];
  const visibleBullets = card.included.slice(0, 3);
  const hiddenBullets = card.included.slice(3);
  const hiddenBulletsCount = hiddenBullets.length;
  const hasExpandableContent = hiddenBulletsCount > 0 || detailsItems.length > 0;

  const deliveryLabel = card.deliveryLabel ?? defaultDeliveryLabel;

  const normalizedPrice = card.price.trim();
  const isHourlyPrice = /\/\s*h\b/i.test(normalizedPrice);
  const heroPrice = normalizedPrice
    .replace(/\s*(einmalig|one-time)\s*$/i, "")
    .trim();
  const priceMeta = isHourlyPrice ? null : "einmalig";

  const badgeLabel = card.isRecommended ? "Empfohlen" : card.key === "maintenance" ? "Add-on" : null;

  const handleCardKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Escape" || !isDetailsOpen) {
      return;
    }
    setIsDetailsOpen(false);
    detailsButtonRef.current?.focus();
  };

  return (
    <article
      className={cardClassName}
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
                <ServiceCardIcon iconAlt={card.iconAlt} iconSrc={card.iconSrc} />
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
          </div>
        </div>

        <p className="services-meta">{card.description}</p>

        <p className="services-price-row">
          <span className="services-price">{heroPrice}</span>
          {priceMeta ? <span className="services-price-meta">{priceMeta}</span> : null}
        </p>

        <p className="services-delivery-badge">
          {deliveryLabel}: {card.delivery}
        </p>

        <ul className="services-list">
          {visibleBullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>

        {hiddenBulletsCount > 0 && !isDetailsOpen ? (
          <p className="services-more-items">+ {hiddenBulletsCount} weitere</p>
        ) : null}

        {hasExpandableContent ? (
          <div className="services-details-toggle-wrap">
            <button
              aria-controls={detailsId}
              aria-expanded={isDetailsOpen}
              className="services-details-toggle"
              onClick={() => setIsDetailsOpen((current) => !current)}
              ref={detailsButtonRef}
              type="button"
            >
              {detailsCtaLabel}
              <span aria-hidden="true">&rsaquo;</span>
            </button>
          </div>
        ) : null}

        {hasExpandableContent ? (
          <div className="services-details-panel" hidden={!isDetailsOpen} id={detailsId}>
            {hiddenBulletsCount > 0 ? (
              <ul className="services-details-list services-details-list--bullets">
                {hiddenBullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
            {detailsItems.length ? (
              <ul className="services-details-list services-details-list--notes">
                {detailsItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
            <div className="services-details-actions">
              <a className="btn btn--primary services-details-cta" href="#contact">
                {primaryCtaLabel}
              </a>
              <a className="services-details-link" href="#faq">
                Fragen?
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}
