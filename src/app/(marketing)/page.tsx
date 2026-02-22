"use client";

import { SiteHeader } from "@/components/marketing/site-header";
import { HeroVisual } from "@/components/marketing/hero-visual";
import { useLanguage } from "@/components/providers/language-provider";
import { PRIMARY_NAVIGATION, SECTION_IDS } from "@/config/site";
import { getHomeSections } from "@/content/landing/home";
import { validateNavigationSections } from "@/domain/navigation/validate-navigation-sections";

export default function MarketingHomePage() {
  const { locale } = useLanguage();
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

  return (
    <>
      <SiteHeader navigation={PRIMARY_NAVIGATION} />

      <main>
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
