"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { SiteHeader } from "@/components/marketing/site-header";
import { HeroVisual } from "@/components/marketing/hero-visual";
import { useLanguage } from "@/components/providers/language-provider";
import { PRIMARY_NAVIGATION, SECTION_IDS } from "@/config/site";
import { getHomeSections } from "@/content/landing/home";
import { validateNavigationSections } from "@/domain/navigation/validate-navigation-sections";

export default function MarketingHomePage() {
  const { locale } = useLanguage();
  const servicesSectionRef = useRef<HTMLElement | null>(null);
  const sections = getHomeSections(locale);
  const proofContent =
    locale === "de"
      ? {
          title: "Warum nicht wie eine Standard-Template-Seite?",
          hint: "Der Fokus liegt auf schneller Lieferung, wenig Aufwand fuer den Kaeufer und messbaren Ergebnissen.",
          cta: "Leistungen ansehen",
          kpis: [
            { value: "5", suffix: " Tage", label: "Time-to-first-draft" },
            { value: "92", suffix: "%", label: "Briefing-Aufwand reduziert" },
            { value: "1", suffix: " Ansprechpartner", label: "Klarer Delivery-Owner" },
          ],
          cards: [
            {
              title: "Time-to-Launch SLA",
              tag: "Fast",
              description:
                "Erste klickbare Version in 5 Werktagen, klarer Go-live Plan je Paket.",
            },
            {
              title: "Upgrade statt Neubau",
              tag: "Lean",
              description:
                "Bestehende Seiten werden gezielt modernisiert, ohne alles neu aufzusetzen.",
            },
            {
              title: "KPI-orientiert",
              tag: "Measured",
              description:
                "Vorab definierte Ziele wie Ladezeit, Leads oder Conversion statt nur Design-Output.",
            },
          ],
        }
      : {
          title: "Why not build it like a generic template site?",
          hint: "The focus is fast delivery, low buyer effort, and measurable outcomes.",
          cta: "View services",
          kpis: [
            { value: "5", suffix: " days", label: "Time-to-first-draft" },
            { value: "92", suffix: "%", label: "Briefing effort reduced" },
            { value: "1", suffix: " owner", label: "Clear delivery owner" },
          ],
          cards: [
            {
              title: "Time-to-launch SLA",
              tag: "Fast",
              description:
                "First clickable version in 5 business days with a clear go-live plan per package.",
            },
            {
              title: "Upgrade over rebuild",
              tag: "Lean",
              description:
                "Existing pages are modernized surgically without forcing a full rebuild.",
            },
            {
              title: "KPI-oriented",
              tag: "Measured",
              description:
                "Predefined targets like speed, leads, and conversion instead of design output only.",
            },
          ],
        };

  const marqueeItems =
    locale === "de"
      ? [
          "B2B Services",
          "Growth Ops",
          "Lead Funnels",
          "CRO Sprints",
          "SEO Grundlagen",
          "Paid + Organic",
          "CRM Integrationen",
          "Tracking Klarheit",
        ]
      : [
          "B2B Services",
          "Growth Ops",
          "Lead Funnels",
          "CRO Sprints",
          "SEO Foundations",
          "Paid + Organic",
          "CRM Integrations",
          "Tracking Clarity",
        ];

  const heroTag = locale === "de" ? "Individuell statt Baukasten" : "Custom instead of templates";
  const heroPrimaryCta = locale === "de" ? "Projekt anfragen" : "Request project";
  const heroSecondaryCta = locale === "de" ? "Leistungen ansehen" : "View services";
  const servicesExampleCta = locale === "de" ? "Mehr erfahren" : "Learn more";
  const heroChipTags =
    locale === "de"
      ? ["Figma-Design inkl.", "Launch in Tagen", "Antwort < 24h"]
      : ["Figma design included", "Launch in days", "Reply < 24h"];

  const getSectionById = (sectionId: (typeof SECTION_IDS)[number]) =>
    sections.find((section) => section.id === sectionId);

  const validation = validateNavigationSections({
    navigationHrefs: PRIMARY_NAVIGATION.map((item) => item.href),
    sectionIds: SECTION_IDS.filter((id) => id !== "hero"),
  });

  useEffect(() => {
    const section = servicesSectionRef.current;
    if (!section) {
      return;
    }

    const cards = Array.from(section.querySelectorAll<HTMLElement>(".services-card"));
    const visualBlocks = Array.from(section.querySelectorAll<HTMLElement>(".services-visual-media"));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isMobile = window.matchMedia("(max-width: 900px)").matches;

    cards.forEach((card, index) => {
      card.style.setProperty("--services-reveal-delay", `${index * 75}ms`);
    });

    if (reducedMotion) {
      cards.forEach((card) => card.classList.add("is-visible"));
      return;
    }

    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries, currentObserver) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              (entry.target as HTMLElement).classList.add("is-visible");
              currentObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.22, rootMargin: "0px 0px -8% 0px" },
      );

      cards.forEach((card) => observer.observe(card));

      const cleanupParallax = setupServicesParallax({
        enabled: !isMobile && visualBlocks.length > 0,
        visualBlocks,
      });

      return () => {
        observer.disconnect();
        cleanupParallax();
      };
    }

    cards.forEach((card) => card.classList.add("is-visible"));
  }, []);

  return (
    <>
      <SiteHeader navigation={PRIMARY_NAVIGATION} />

      <main>
        <div aria-hidden="true" className="page-accents">
          <span className="page-aurora page-aurora--left" />
          <span className="page-aurora page-aurora--right" />
          <span className="page-noise" />
        </div>

        <section className="hero" id="hero">
          <div className="hero__noise" />
          <div className="hero__aurora hero__aurora--left" />
          <div className="hero__aurora hero__aurora--right" />

          <div className="hero__grid">
            <div className="hero__content">
              <p className="hero__tag">{heroTag}</p>
              <h1>
                <span className="hero__title-gradient">{sections[0]?.title}</span>
              </h1>
              <p>{sections[0]?.description}</p>
              <div className="hero__cta-row">
                <a className="btn btn--primary" href="#contact">
                  {heroPrimaryCta}
                </a>
                <a className="btn btn--ghost" href="#services">
                  {heroSecondaryCta}
                </a>
              </div>

              <div className="hero__tags" aria-label="Kurzvorteile">
                {heroChipTags.map((item) => (
                  <span className="chip-tag" key={item}>
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <HeroVisual />
          </div>
        </section>

        <section aria-label="Capability Marquee" className="marquee-section">
          <div className="marquee">
            <div className="marquee__track">
              {marqueeItems.concat(marqueeItems).map((item, index) => (
                <span className="marquee__item" key={`${item}-${index}`}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <div className="layout-shell">
          {!validation.hasCompleteMapping ? (
            <p className="phase-zero-warning" role="status">
              {locale === "de"
                ? "Navigation/Section Mapping ist unvollstaendig."
                : "Navigation/section mapping is incomplete."}
            </p>
          ) : null}

          {SECTION_IDS.filter((id) => id !== "hero").map((id) => {
            const section = getSectionById(id);
            if (!section) {
              return null;
            }

            if (section.id === "proof") {
              return (
                <section className="proof-section" id={section.id} key={section.id}>
                  <h2>{proofContent.title}</h2>
                  <p className="proof-hint">{proofContent.hint}</p>

                  <div className="proof-metrics" role="list">
                    {proofContent.kpis.map((metric) => (
                      <article className="proof-metric-card" key={metric.label} role="listitem">
                        <div className="proof-metric-value">
                          <span>{metric.value}</span>
                          <span>{metric.suffix}</span>
                        </div>
                        <p className="proof-metric-label">{metric.label}</p>
                      </article>
                    ))}
                  </div>

                  <div className="proof-cards" role="list">
                    {proofContent.cards.map((card) => (
                      <article className="proof-card" key={card.title} role="listitem">
                        <div className="proof-card-head">
                          <h3>{card.title}</h3>
                          <span className="proof-badge">
                            <i aria-hidden="true" />
                            {card.tag}
                          </span>
                        </div>
                        <p>{card.description}</p>
                      </article>
                    ))}
                  </div>
                </section>
              );
            }

            if (section.id === "services") {
              const cards = section.serviceCards ?? [];

              return (
                <section
                  className="services-section"
                  id={section.id}
                  key={section.id}
                  ref={servicesSectionRef}
                >
                  <h2>{section.title}</h2>
                  <p className="services-hint">{section.description}</p>

                  <div className="services-bento" role="list">
                    {cards.map((card) => {
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
                        <article className={cardClassName} key={card.title} role="listitem">
                          <div className="services-card-top">
                            <div className="services-card-row">
                              <h3 className="services-title">
                                {card.iconSrc ? (
                                  <Image
                                    alt={card.iconAlt ?? ""}
                                    className="services-title-icon-image"
                                    height={32}
                                    src={card.iconSrc}
                                    width={32}
                                  />
                                ) : card.icon ? (
                                  <span aria-hidden="true" className="services-title-icon">
                                    {card.icon}
                                  </span>
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
                                <svg fill="none" viewBox="0 0 900 260" xmlns="http://www.w3.org/2000/svg">
                                  <path
                                    d="M40 200h220l30-24h180l30 24h360"
                                    stroke="rgba(245,158,11,0.32)"
                                    strokeLinecap="round"
                                    strokeWidth="8"
                                  />
                                  <rect fill="rgba(255,255,255,0.08)" height="10" rx="5" width="140" x="90" y="90" />
                                  <rect fill="rgba(255,255,255,0.08)" height="10" rx="5" width="110" x="90" y="108" />
                                  <rect fill="rgba(99,102,241,0.20)" height="8" rx="4" width="180" x="90" y="128" />
                                  <rect fill="rgba(255,255,255,0.06)" height="104" rx="16" width="260" x="560" y="92" />
                                  <rect fill="rgba(255,255,255,0.08)" height="66" rx="10" width="154" x="590" y="112" />
                                  <rect fill="rgba(245,158,11,0.34)" height="14" rx="7" width="108" x="612" y="124" />
                                </svg>
                              ) : card.visualVariant === "upgrade" ? (
                                <svg fill="none" viewBox="0 0 900 260" xmlns="http://www.w3.org/2000/svg">
                                  <rect fill="rgba(255,255,255,0.06)" height="112" rx="16" width="230" x="82" y="118" />
                                  <rect fill="rgba(255,255,255,0.05)" height="112" rx="16" width="270" x="336" y="118" />
                                  <rect fill="rgba(255,255,255,0.04)" height="112" rx="16" width="250" x="626" y="118" />
                                  <path
                                    d="M354 182c36-24 62-24 90 0s58 24 86 0 54-24 84 0"
                                    stroke="rgba(245,158,11,0.32)"
                                    strokeLinecap="round"
                                    strokeWidth="8"
                                  />
                                </svg>
                              ) : (
                                <svg fill="none" viewBox="0 0 900 260" xmlns="http://www.w3.org/2000/svg">
                                  <path
                                    d="M40 186c86-76 178-76 276 0s190 76 276 0 190-76 268 0"
                                    stroke="rgba(20,184,166,0.38)"
                                    strokeLinecap="round"
                                    strokeWidth="10"
                                  />
                                  <path
                                    d="M60 120c78-56 162-56 252 0s174 56 252 0 174-56 236 0"
                                    stroke="rgba(245,158,11,0.22)"
                                    strokeLinecap="round"
                                    strokeWidth="10"
                                  />
                                  <rect fill="rgba(255,255,255,0.08)" height="12" rx="6" width="148" x="92" y="50" />
                                  <rect fill="rgba(20,184,166,0.22)" height="10" rx="5" width="200" x="92" y="70" />
                                  <rect fill="rgba(255,255,255,0.08)" height="12" rx="6" width="118" x="378" y="50" />
                                  <rect fill="rgba(99,102,241,0.18)" height="10" rx="5" width="164" x="378" y="70" />
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

            return (
              <section className="content-section" id={section.id} key={section.id}>
                <h2>{section.title}</h2>
                <p>{section.description}</p>
              </section>
            );
          })}
        </div>
      </main>
    </>
  );
}

function setupServicesParallax({
  enabled,
  visualBlocks,
}: {
  enabled: boolean;
  visualBlocks: HTMLElement[];
}) {
  if (!enabled) {
    return () => {};
  }

  let rafId = 0;

  const update = () => {
    const viewportHeight = window.innerHeight || 1;
    const viewportCenter = viewportHeight * 0.5;

    visualBlocks.forEach((block) => {
      const rect = block.getBoundingClientRect();
      const blockCenter = rect.top + rect.height * 0.5;
      const normalized = (viewportCenter - blockCenter) / viewportHeight;
      const offset = Math.max(-26, Math.min(26, normalized * 44));
      block.style.setProperty("--services-parallax-y", `${offset.toFixed(2)}px`);
    });

    rafId = 0;
  };

  const requestUpdate = () => {
    if (rafId !== 0) {
      return;
    }
    rafId = window.requestAnimationFrame(update);
  };

  requestUpdate();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);

  return () => {
    if (rafId !== 0) {
      window.cancelAnimationFrame(rafId);
    }
    window.removeEventListener("scroll", requestUpdate);
    window.removeEventListener("resize", requestUpdate);
  };
}
