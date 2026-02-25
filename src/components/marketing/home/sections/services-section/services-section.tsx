import type { PointerEvent, RefObject } from "react";

import type { LandingSectionCopy } from "@/content/landing/home";
import { ServiceCardIcon } from "@/components/marketing/home/sections/services-section/service-card-icon";

type ServiceCard = NonNullable<LandingSectionCopy["serviceCards"]>[number];

type ServicesSectionProps = {
  description: string;
  id: string;
  sectionRef: RefObject<HTMLElement | null>;
  servicesExampleCta: string;
  serviceCards: ServiceCard[];
  title: string;
};

export function ServicesSection({
  description,
  id,
  sectionRef,
  serviceCards,
  servicesExampleCta,
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
      <p className="services-hint">{description}</p>

      <div className="services-bento" role="list">
        {serviceCards.map((card) => {
          const isVisual = Boolean(card.visual);
          const spanClassName =
            card.span === 4
              ? "services-span-4"
              : card.span === 6
                ? "services-span-6"
                : isVisual
                  ? "services-span-7"
                  : "services-span-5";
          const cardClassName = `services-card ${isVisual ? "services-card--visual" : ""} ${spanClassName}`;

          return (
            <article
              className={cardClassName}
              key={card.title}
              onPointerLeave={resetCardSpotlight}
              onPointerMove={setCardSpotlight}
              role="listitem"
            >
              <div className="services-card-top">
                <div className="services-card-row">
                  <h3 className="services-title">
                    {card.icon ? (
                      <span aria-hidden="true" className="services-title-icon">
                        {card.icon}
                      </span>
                    ) : card.iconSrc ? (
                      <ServiceCardIcon
                        iconAlt={card.iconAlt}
                        iconSrc={card.iconSrc}
                      />
                    ) : null}
                    <span>{card.title}</span>
                  </h3>
                  <span className="services-tag">{card.tag}</span>
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

              {isVisual ? (
                <div className="services-visual-media" aria-hidden="true">
                  {card.visualVariant === "ai" ? (
                    <svg
                      fill="none"
                      viewBox="0 0 900 260"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M40 200h220l30-24h180l30 24h360"
                        stroke="rgba(151,176,213,0.32)"
                        strokeLinecap="round"
                        strokeWidth="8"
                      />
                      <rect
                        fill="rgba(255,255,255,0.08)"
                        height="10"
                        rx="5"
                        width="140"
                        x="90"
                        y="90"
                      />
                      <rect
                        fill="rgba(255,255,255,0.08)"
                        height="10"
                        rx="5"
                        width="110"
                        x="90"
                        y="108"
                      />
                      <rect
                        fill="rgba(126,152,190,0.2)"
                        height="8"
                        rx="4"
                        width="180"
                        x="90"
                        y="128"
                      />
                      <rect
                        fill="rgba(255,255,255,0.06)"
                        height="104"
                        rx="16"
                        width="260"
                        x="560"
                        y="92"
                      />
                      <rect
                        fill="rgba(255,255,255,0.08)"
                        height="66"
                        rx="10"
                        width="154"
                        x="590"
                        y="112"
                      />
                      <rect
                        fill="rgba(231,154,73,0.18)"
                        height="14"
                        rx="7"
                        width="108"
                        x="612"
                        y="124"
                      />
                    </svg>
                  ) : card.visualVariant === "upgrade" ? (
                    <svg
                      fill="none"
                      viewBox="0 0 900 260"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect
                        fill="rgba(255,255,255,0.06)"
                        height="112"
                        rx="16"
                        width="230"
                        x="82"
                        y="118"
                      />
                      <rect
                        fill="rgba(255,255,255,0.05)"
                        height="112"
                        rx="16"
                        width="270"
                        x="336"
                        y="118"
                      />
                      <rect
                        fill="rgba(255,255,255,0.04)"
                        height="112"
                        rx="16"
                        width="250"
                        x="626"
                        y="118"
                      />
                      <path
                        d="M354 182c36-24 62-24 90 0s58 24 86 0 54-24 84 0"
                        stroke="rgba(146,171,208,0.34)"
                        strokeLinecap="round"
                        strokeWidth="8"
                      />
                    </svg>
                  ) : (
                    <svg
                      fill="none"
                      viewBox="0 0 900 260"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M40 186c86-76 178-76 276 0s190 76 276 0 190-76 268 0"
                        stroke="rgba(124,150,188,0.36)"
                        strokeLinecap="round"
                        strokeWidth="10"
                      />
                      <path
                        d="M60 120c78-56 162-56 252 0s174 56 252 0 174-56 236 0"
                        stroke="rgba(150,175,213,0.22)"
                        strokeLinecap="round"
                        strokeWidth="10"
                      />
                      <rect
                        fill="rgba(255,255,255,0.08)"
                        height="12"
                        rx="6"
                        width="148"
                        x="92"
                        y="50"
                      />
                      <rect
                        fill="rgba(120,146,186,0.22)"
                        height="10"
                        rx="5"
                        width="200"
                        x="92"
                        y="70"
                      />
                      <rect
                        fill="rgba(255,255,255,0.08)"
                        height="12"
                        rx="6"
                        width="118"
                        x="378"
                        y="50"
                      />
                      <rect
                        fill="rgba(117,142,180,0.18)"
                        height="10"
                        rx="5"
                        width="164"
                        x="378"
                        y="70"
                      />
                    </svg>
                  )}
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
