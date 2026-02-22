import { SiteHeader } from "@/components/marketing/site-header";
import { PRIMARY_NAVIGATION, SECTION_IDS } from "@/config/site";
import { HOME_SECTIONS } from "@/content/landing/home";
import { validateNavigationSections } from "@/domain/navigation/validate-navigation-sections";

function getSectionById(sectionId: (typeof SECTION_IDS)[number]) {
  return HOME_SECTIONS.find((section) => section.id === sectionId);
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
          <div className="hero__content">
            <p className="hero__eyebrow">{HOME_SECTIONS[0]?.eyebrow}</p>
            <h1>{HOME_SECTIONS[0]?.title}</h1>
            <p>{HOME_SECTIONS[0]?.description}</p>
          </div>
        </section>

        <div className="layout-shell">
          {!validation.hasCompleteMapping ? (
            <p className="phase-zero-warning" role="status">
              Navigation/Section Mapping ist unvollstaendig.
            </p>
          ) : null}

          {SECTION_IDS.filter((id) => id !== "hero").map((id) => {
            const section = getSectionById(id);
            if (!section) {
              return null;
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
