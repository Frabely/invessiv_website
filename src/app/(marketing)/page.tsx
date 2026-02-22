import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { HeroVisual } from "@/components/marketing/hero-visual";
import { PRIMARY_NAVIGATION, SECTION_IDS } from "@/config/site";
import { HOME_SECTIONS } from "@/content/landing/home";
import { validateNavigationSections } from "@/domain/navigation/validate-navigation-sections";

const MARQUEE_ITEMS = [
  "B2B Services",
  "Growth Ops",
  "Lead Funnels",
  "CRO Sprints",
  "SEO Foundations",
  "Paid + Organic",
  "CRM Integrations",
  "Tracking Clarity",
];

function getSectionById(sectionId: (typeof SECTION_IDS)[number]) {
  return HOME_SECTIONS.find((section) => section.id === sectionId);
}

function renderSection(sectionId: (typeof SECTION_IDS)[number]) {
  const section = getSectionById(sectionId);
  if (!section) {
    return null;
  }

  if (section.id === "proof" && section.metrics) {
    return (
      <section className="content-section" id={section.id} key={section.id}>
        <h2>{section.title}</h2>
        <p>{section.description}</p>
        <div className="metric-grid">
          {section.metrics.map((metric) => (
            <article className="metric-card" key={metric.label}>
              <p className="metric-card__label">{metric.label}</p>
              <p className="metric-card__value">{metric.value}</p>
            </article>
          ))}
        </div>
      </section>
    );
  }

  if ((section.id === "services" || section.id === "pricing" || section.id === "contact") && section.cards) {
    return (
      <section className="content-section" id={section.id} key={section.id}>
        <h2>{section.title}</h2>
        <p>{section.description}</p>
        <div className="feature-grid">
          {section.cards.map((card) => (
            <article className="feature-card" key={card.title}>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              {card.points ? (
                <ul>
                  {card.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (section.id === "process" && section.steps) {
    return (
      <section className="content-section" id={section.id} key={section.id}>
        <h2>{section.title}</h2>
        <p>{section.description}</p>
        <ol className="process-list">
          {section.steps.map((step) => (
            <li className="process-list__item" key={step.step}>
              <span className="process-list__index">{step.step}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    );
  }

  return (
    <section className="content-section" id={section.id} key={section.id}>
      <h2>{section.title}</h2>
      <p>{section.description}</p>
    </section>
  );
}

export default function MarketingHomePage() {
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
              <p className="hero__tag">Individuell statt Baukasten</p>
              <p className="hero__eyebrow">{HOME_SECTIONS[0]?.eyebrow}</p>
              <h1>
                <span className="hero__title-gradient">
                  Mit wenig Zeitaufwand schnell zu einer fertigen Website.
                </span>
              </h1>
              <p>
                Du gibst nur den noetigen Input, wir uebernehmen den Rest:
                Landingpages, Webseiten und Prozess-Tools mit schneller Umsetzung
                bis zum produktiven Ergebnis.
              </p>
              <div className="hero__cta-row">
                <a className="btn btn--primary" href="#contact">
                  Projekt anfragen
                </a>
                <a className="btn btn--ghost" href="#services">
                  Leistungen ansehen
                </a>
              </div>

              <div className="hero__tags" aria-label="Kurzvorteile">
                <span className="chip-tag">Figma-Design inkl.</span>
                <span className="chip-tag">Launch in Tagen</span>
                <span className="chip-tag">Antwort &lt; 24h</span>
              </div>
            </div>

            <HeroVisual />
          </div>
        </section>

        <section aria-label="Capability Marquee" className="marquee-section">
          <div className="marquee">
            <div className="marquee__track">
              {MARQUEE_ITEMS.concat(MARQUEE_ITEMS).map((item, index) => (
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
              Navigation/Section Mapping ist unvollstaendig.
            </p>
          ) : null}

          {SECTION_IDS.filter((id) => id !== "hero").map((id) => renderSection(id))}
        </div>
      </main>

      <SiteFooter navigation={PRIMARY_NAVIGATION} />
    </>
  );
}
