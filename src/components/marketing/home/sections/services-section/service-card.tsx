import type { PointerEvent } from "react";

import type { LandingSectionCopy } from "@/content/landing/home";
import { ServiceCardIcon } from "@/components/marketing/home/sections/services-section/service-card-icon";
import { ServiceCardVisual } from "@/components/marketing/home/sections/services-section/service-card-visual";

type ServiceCardCopy = NonNullable<LandingSectionCopy["serviceCards"]>[number];

type ServiceCardProps = {
  card: ServiceCardCopy;
  cardClassName: string;
  onPointerLeave: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  servicesExampleCta: string;
};

export function ServiceCard({
  card,
  cardClassName,
  onPointerLeave,
  onPointerMove,
  servicesExampleCta,
}: ServiceCardProps) {
  const isVisual = Boolean(card.visual);

  return (
    <article
      className={cardClassName}
      onPointerLeave={onPointerLeave}
      onPointerMove={onPointerMove}
      role="listitem"
    >
      <div className="services-card-top">
        <div className="services-card-row">
          <div className="services-title-wrap">
            <h3 className="services-title">
              {card.icon ? (
                <span aria-hidden="true" className="services-title-icon">
                  {card.icon}
                </span>
              ) : card.iconSrc ? (
                <ServiceCardIcon iconAlt={card.iconAlt} iconSrc={card.iconSrc} />
              ) : null}
              <span>{card.title}</span>
            </h3>
            <span className="services-tag">{card.tag}</span>
          </div>
        </div>

        <p className="services-meta">{card.description}</p>

        {card.chips?.length ? (
          <div className="services-chip-row" aria-label="Service Tags">
            {card.chips.map((chip) => (
              <span className="services-chip" key={chip}>
                <i aria-hidden="true" />
                {chip}
              </span>
            ))}
          </div>
        ) : null}
        {card.bullets?.length ? (
          <ul className="services-list">
            {card.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        ) : null}

        <a className="services-example-btn" href="#contact">
          {servicesExampleCta}
        </a>
      </div>

      {isVisual ? <ServiceCardVisual visualVariant={card.visualVariant} /> : null}
    </article>
  );
}
