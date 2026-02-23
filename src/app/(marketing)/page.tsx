"use client";

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
  const processSectionRef = useRef<HTMLElement | null>(null);
  const processStepsRef = useRef<HTMLDivElement | null>(null);
  const processPathRef = useRef<SVGPathElement | null>(null);
  const processDotRef = useRef<SVGCircleElement | null>(null);
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
            {
              value: "1",
              suffix: " Ansprechpartner",
              label: "Klarer Delivery-Owner",
            },
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

  const heroTag =
    locale === "de"
      ? "Individuell statt Baukasten"
      : "Custom instead of templates";
  const heroPrimaryCta =
    locale === "de" ? "Projekt anfragen" : "Request project";
  const heroSecondaryCta =
    locale === "de" ? "Leistungen ansehen" : "View services";
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

    const cards = Array.from(
      section.querySelectorAll<HTMLElement>(".services-card"),
    );
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    cards.forEach((card, index) => {
      card.classList.remove("is-visible");
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

      return () => {
        observer.disconnect();
      };
    }

    cards.forEach((card) => card.classList.add("is-visible"));
  }, [locale]);

  useEffect(() => {
    const section = processSectionRef.current;
    const stepsContainer = processStepsRef.current;
    const path = processPathRef.current;
    const dot = processDotRef.current;

    if (!section || !stepsContainer || !path || !dot) {
      return;
    }

    const stepCards = Array.from(
      section.querySelectorAll<HTMLElement>(".process-step"),
    );
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const isMobile = window.matchMedia("(max-width: 900px)").matches;

    const cleanup = setupProcessJourney({
      dot,
      isMobile,
      path,
      reducedMotion,
      section,
      stepsContainer,
      stepCards,
    });

    return cleanup;
  }, [locale]);

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
                <span className="hero__title-gradient">
                  {sections[0]?.title}
                </span>
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
                <section
                  className="proof-section"
                  id={section.id}
                  key={section.id}
                >
                  <h2>{proofContent.title}</h2>
                  <p className="proof-hint">{proofContent.hint}</p>

                  <div className="proof-metrics" role="list">
                    {proofContent.kpis.map((metric) => (
                      <article
                        className="proof-metric-card"
                        key={metric.label}
                        role="listitem"
                      >
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
                      <article
                        className="proof-card"
                        key={card.title}
                        role="listitem"
                      >
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
                        <article
                          className={cardClassName}
                          key={card.title}
                          role="listitem"
                        >
                          <div className="services-card-top">
                            <div className="services-card-row">
                              <h3 className="services-title">
                                {card.icon ? (
                                  <span
                                    aria-hidden="true"
                                    className="services-title-icon"
                                  >
                                    {card.icon}
                                  </span>
                                ) : null}
                                <span>{card.title}</span>
                              </h3>
                              <span className="services-tag">{card.tag}</span>
                            </div>

                            <p className="services-meta">{card.description}</p>

                            {card.chips?.length ? (
                              <div
                                className="services-chip-row"
                                aria-label="Service Tags"
                              >
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
                            <div
                              className="services-visual-media"
                              aria-hidden="true"
                            >
                              {card.visualVariant === "ai" ? (
                                <svg
                                  fill="none"
                                  viewBox="0 0 900 260"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M40 200h220l30-24h180l30 24h360"
                                    stroke="rgba(245,158,11,0.32)"
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
                                    fill="rgba(99,102,241,0.20)"
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
                                    fill="rgba(245,158,11,0.34)"
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
                                    stroke="rgba(245,158,11,0.32)"
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
                                  <rect
                                    fill="rgba(255,255,255,0.08)"
                                    height="12"
                                    rx="6"
                                    width="148"
                                    x="92"
                                    y="50"
                                  />
                                  <rect
                                    fill="rgba(20,184,166,0.22)"
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
                                    fill="rgba(99,102,241,0.18)"
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

            if (section.id === "process") {
              const processSteps = section.processSteps ?? [];
              const processRoles = section.processRoles ?? [];
              const processCta = section.processCta;

              return (
                <section
                  className="process-section"
                  id={section.id}
                  key={section.id}
                  ref={processSectionRef}
                >
                  <h2>{section.title}</h2>
                  <p className="process-hint">{section.description}</p>
                  {section.processSummary ? (
                    <p className="process-summary" role="status">
                      {section.processSummary}
                    </p>
                  ) : null}

                  <div className="process-intro">
                    {processRoles.length ? (
                      <div className="process-roles-inline" role="list">
                        {processRoles.map((role) => (
                          <p
                            className="process-role-line"
                            key={role.label}
                            role="listitem"
                          >
                            <strong>{role.label}:</strong>{" "}
                            {role.items.join(" | ")}
                          </p>
                        ))}
                      </div>
                    ) : null}

                    {processCta ? (
                      <aside className="process-intro-cta">
                        <a className="btn btn--primary" href={processCta.href}>
                          {processCta.label}
                        </a>
                        <p>{processCta.hint}</p>
                      </aside>
                    ) : null}
                  </div>

                  <div className="process-layout">
                    <svg
                      aria-label="Process journey path"
                      className="process-journey-svg process-journey-svg--overlay"
                      role="img"
                      viewBox="0 0 1200 900"
                    >
                      <defs>
                        <linearGradient
                          id="processJourneyStroke"
                          x1="0%"
                          x2="0%"
                          y1="0%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor="#52e0c2" />
                          <stop offset="50%" stopColor="#7da3ff" />
                          <stop offset="100%" stopColor="#f59e0b" />
                        </linearGradient>
                      </defs>

                      <path
                        className="process-journey-path"
                        d="M80 40 C 80 220, 1120 220, 1120 360 C 1120 520, 80 520, 80 680 C 80 760, 1120 760, 1120 860"
                        fill="none"
                        ref={processPathRef}
                        stroke="url(#processJourneyStroke)"
                        strokeLinecap="round"
                        strokeWidth="10"
                      />
                      <circle
                        className="process-journey-dot"
                        cx="80"
                        cy="40"
                        r="12"
                        ref={processDotRef}
                      />
                    </svg>

                    <div
                      className="process-steps"
                      ref={processStepsRef}
                      role="list"
                    >
                      {processSteps.map((step, index) => (
                        <article
                          className="process-step"
                          key={step.step}
                          role="listitem"
                          style={{
                            ["--process-step-delay" as string]: `${index * 80}ms`,
                          }}
                        >
                          <div className="process-step-inner">
                            <p className="process-step-index">{step.step}</p>
                            <h3>{step.title}</h3>
                            {step.deliverable ? (
                              <p className="process-deliverable">
                                {step.deliverable}
                              </p>
                            ) : null}
                            {(step.effort || step.result) && (
                              <div className="process-step-meta" role="list">
                                {step.effort ? (
                                  <span role="listitem">{step.effort}</span>
                                ) : null}
                                {step.result ? (
                                  <span role="listitem">{step.result}</span>
                                ) : null}
                              </div>
                            )}
                            <p>{step.description}</p>
                          </div>
                        </article>
                      ))}
                    </div>
                  </div>
                </section>
              );
            }

            return (
              <section
                className={`content-section ${section.id === "pricing" || section.id === "contact" ? "content-section--tall" : ""}`}
                id={section.id}
                key={section.id}
              >
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

function setupProcessJourney({
  dot,
  isMobile,
  path,
  reducedMotion,
  section,
  stepsContainer,
  stepCards,
}: {
  dot: SVGCircleElement;
  isMobile: boolean;
  path: SVGPathElement;
  reducedMotion: boolean;
  section: HTMLElement;
  stepsContainer: HTMLElement;
  stepCards: HTMLElement[];
}) {
  let pathLength = 0;
  let lastVisibleCount = 0;
  let pulseTimeout: number | null = null;

  const recalculatePath = () => {
    const svg = path.ownerSVGElement;
    if (svg) {
      const width = Math.max(960, Math.round(stepsContainer.clientWidth));
      const height = Math.max(
        760,
        Math.round(stepsContainer.scrollHeight + 24),
      );
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    }

    const nextPath = buildProcessJourneyPathD(stepCards, stepsContainer);
    path.setAttribute("d", nextPath);
    pathLength = path.getTotalLength();
    path.style.strokeDasharray = String(pathLength);
  };

  recalculatePath();

  const setProgress = (progress: number) => {
    const clamped = Math.max(0, Math.min(1, progress));
    path.style.strokeDashoffset = String(pathLength - pathLength * clamped);
    const point = path.getPointAtLength(pathLength * clamped);
    dot.setAttribute("cx", point.x.toFixed(2));
    dot.setAttribute("cy", point.y.toFixed(2));

    let visibleCount = 0;
    stepCards.forEach((card) => {
      const cardMidY = card.offsetTop + card.offsetHeight * 0.5;
      const isVisible = point.y >= cardMidY;
      card.classList.toggle("is-visible", isVisible);
      if (isVisible) {
        visibleCount += 1;
      }
    });

    if (visibleCount > lastVisibleCount) {
      dot.classList.remove("process-journey-dot--pulse-final");
      dot.classList.remove("process-journey-dot--pulse");
      void dot.getBoundingClientRect();
      dot.classList.add("process-journey-dot--pulse");
      if (pulseTimeout) {
        window.clearTimeout(pulseTimeout);
      }
      pulseTimeout = window.setTimeout(() => {
        dot.classList.remove("process-journey-dot--pulse");
      }, 320);
    }
    lastVisibleCount = visibleCount;

    const lastCard = stepCards[stepCards.length - 1];
    const finalStopY = lastCard
      ? lastCard.offsetTop + lastCard.offsetHeight * 0.5
      : Infinity;
    const isAtFinalStop = clamped >= 0.999 && point.y >= finalStopY - 1;
    if (isAtFinalStop) {
      if (pulseTimeout) {
        window.clearTimeout(pulseTimeout);
        pulseTimeout = null;
      }
      dot.classList.remove("process-journey-dot--pulse");
      dot.classList.add("process-journey-dot--pulse-final");
    } else {
      dot.classList.remove("process-journey-dot--pulse-final");
    }

    section.style.setProperty("--process-glow-x", `${point.x.toFixed(2)}px`);
    section.style.setProperty("--process-glow-y", `${point.y.toFixed(2)}px`);
    return clamped;
  };

  if (reducedMotion) {
    setProgress(1);
    stepCards.forEach((card) => card.classList.add("is-visible"));
    return () => {};
  }

  if (isMobile) {
    setProgress(1);

    if (!("IntersectionObserver" in window)) {
      stepCards.forEach((card) => card.classList.add("is-visible"));
      return () => {};
    }

    const observer = new IntersectionObserver(
      (entries, currentObserver) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).classList.add("is-visible");
            currentObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" },
    );

    stepCards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }

  let rafId = 0;

  const update = () => {
    const stepsRect = stepsContainer.getBoundingClientRect();
    const start = window.innerHeight * 0.9;
    const end = window.innerHeight * 0.24;
    const fullRange = stepsRect.height + (start - end);
    const progress = (start - stepsRect.top) / Math.max(1, fullRange);
    const acceleratedProgress = progress * 1.75;
    setProgress(acceleratedProgress);

    rafId = 0;
  };

  const requestUpdate = () => {
    if (rafId !== 0) {
      return;
    }
    rafId = window.requestAnimationFrame(update);
  };

  const handleResize = () => {
    recalculatePath();
    requestUpdate();
  };

  requestUpdate();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", handleResize);

  return () => {
    if (rafId !== 0) {
      window.cancelAnimationFrame(rafId);
    }
    if (pulseTimeout) {
      window.clearTimeout(pulseTimeout);
    }
    window.removeEventListener("scroll", requestUpdate);
    window.removeEventListener("resize", handleResize);
  };
}

function buildProcessJourneyPathD(
  stepCards: HTMLElement[],
  stepsContainer: HTMLElement,
) {
  const width = Math.max(960, Math.round(stepsContainer.clientWidth));
  const height = Math.max(760, Math.round(stepsContainer.scrollHeight + 24));
  const sidePadding = Math.max(46, Math.min(84, Math.round(width * 0.06)));
  const leftX = sidePadding;
  const rightX = width - sidePadding;
  const edgeShift = Math.max(12, Math.round(sidePadding * 0.26));
  const startX = Math.max(8, leftX - edgeShift * 4);
  const endX = Math.min(width - 8, rightX + edgeShift * 4);

  if (stepCards.length === 0) {
    return `M${startX} 30 C ${startX} 260, ${rightX} 260, ${endX} ${height - 40}`;
  }

  const firstCard = stepCards[0];
  const lastCard = stepCards[stepCards.length - 1];
  const startY = firstCard.offsetTop + firstCard.offsetHeight * 0.5;
  let d = `M${startX} ${startY}`;

  let currentX = startX;
  let currentY = startY;

  // Build a snake-like path that runs in the vertical spacing between cards.
  for (let index = 0; index < stepCards.length - 1; index += 1) {
    const currentCard = stepCards[index];
    const nextCard = stepCards[index + 1];
    const currentBottom = currentCard.offsetTop + currentCard.offsetHeight;
    const nextTop = nextCard.offsetTop;
    const availableGap = Math.max(0, nextTop - currentBottom);
    const laneY = currentBottom + availableGap * 0.5;
    const targetX = index % 2 === 0 ? rightX : leftX;
    d += ` L ${currentX} ${laneY}`;
    d += ` L ${targetX} ${laneY}`;

    currentX = targetX;
    currentY = laneY;
  }

  if (currentX !== rightX) {
    d += ` L ${rightX} ${currentY}`;
    currentX = rightX;
  }

  const endY = Math.min(
    height - 22,
    lastCard.offsetTop + lastCard.offsetHeight + 18,
  );
  d += ` L ${currentX} ${endY}`;
  d += ` L ${endX} ${endY}`;

  return d;
}
