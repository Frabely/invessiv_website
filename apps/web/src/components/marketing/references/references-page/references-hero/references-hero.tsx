import type { ReferenceCaseStudyContent } from "@/common/contracts/marketing/reference-case-study";
import { Breadcrumbs } from "@invessiv/ui";
import Link from "next/link";
import { EyebrowPill } from "@/components/shared/eyebrow-pill/eyebrow-pill";
import { GradientText } from "@/components/shared/gradient-text/gradient-text";
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
      <div className={styles.crumbs}>
        <Breadcrumbs
          items={[
            { href: homeHref, label: breadcrumbs.homeLabel },
            { label: breadcrumbs.currentLabel },
          ]}
          linkComponent={Link}
          navLabel={breadcrumbs.navLabel}
        />
      </div>

      <div className={styles.copy}>
        <EyebrowPill>{content.kicker}</EyebrowPill>
        <h1 className={styles.title}>
          <GradientText>{content.title}</GradientText>
        </h1>
        <ol className={styles.questions}>
          {content.questions.map((question) => (
            <li className={styles.question} key={question.keyword}>
              {question.lead}
              <strong className={styles.keyword}>{question.keyword}</strong>
              {question.trail}
            </li>
          ))}
        </ol>
        <p className={styles.note}>{content.note}</p>
      </div>

      <ul aria-label={content.indexLabel} className={styles.index}>
        {projects.map((project, index) => (
          <li key={project.imageKey}>
            <ReferenceIndexCard
              clientName={project.clientName}
              imageKey={project.imageKey}
              industry={project.industry}
              priority={index === 0}
              shots={project.shots}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
