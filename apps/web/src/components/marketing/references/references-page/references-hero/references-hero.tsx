import type { ReferenceCaseStudyContent } from "@/common/contracts/marketing/reference-case-study";
import { Breadcrumbs } from "@/components/legal/breadcrumbs/breadcrumbs";
import { REFERENCES_PAGE_SECTION_IDS } from "@/config/navigation/references";
import type {
  ReferencesBreadcrumbsContent,
  ReferencesHeroContent,
} from "@/i18n/dictionaries/marketing/references";
import { ReferenceIndexCard } from "./reference-index-card/reference-index-card";
import styles from "./references-hero.module.css";

type ReferencesHeroProps = {
  breadcrumbs: ReferencesBreadcrumbsContent;
  content: ReferencesHeroContent;
  homeHref: string;
  projects: ReferenceCaseStudyContent[];
};

export function ReferencesHero({
  breadcrumbs,
  content,
  homeHref,
  projects,
}: ReferencesHeroProps) {
  return (
    <section className={styles.hero} id={REFERENCES_PAGE_SECTION_IDS.hero}>
      <Breadcrumbs
        items={[
          { href: homeHref, isLink: true, label: breadcrumbs.homeLabel },
          { isLink: false, label: breadcrumbs.currentLabel },
        ]}
        navLabel={breadcrumbs.navLabel}
      />

      <div className={styles.copy}>
        <h1 className={styles.title}>{content.title}</h1>
        <p className={styles.intro}>{content.intro}</p>
      </div>

      <ul aria-label={content.indexLabel} className={styles.index}>
        {projects.map((project, index) => (
          <li key={project.imageKey}>
            <ReferenceIndexCard
              clientName={project.clientName}
              imageKey={project.imageKey}
              industry={project.industry}
              priority={index === 0}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
