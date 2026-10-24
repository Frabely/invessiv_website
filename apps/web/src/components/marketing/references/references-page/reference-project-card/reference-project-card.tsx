import { AnalyticsEventName } from "@/common/constants/analytics/analytics-event-name";
import { AnalyticsTarget } from "@/common/constants/analytics/analytics-target";
import { analyticsAttributes } from "@/common/patterns/analytics/analytics-properties";
import { REFERENCE_IMAGE_DEVICE } from "@/common/constants/marketing/reference-image-device";
import { REFERENCE_SECTION_IDS } from "@/common/constants/marketing/reference-section-ids";
import type { ReferenceCaseStudyContent } from "@/common/contracts/marketing/reference-case-study";
import type { ReferenceCaseStudyLabels } from "@/common/contracts/marketing/reference-case-study-labels";
import { ReferenceTestimonial } from "@/components/marketing/shared/reference-testimonial/reference-testimonial";
import { EyebrowPill } from "@/components/shared/eyebrow-pill/eyebrow-pill";
import { ReferenceCaseStory } from "./reference-case-story/reference-case-story";
import { ReferenceResultGallery } from "./reference-result-gallery/reference-result-gallery";
import styles from "./reference-project-card.module.css";
import { TextCta } from "@/components/shared/text-cta/text-cta";

type ReferenceProjectCardProps = {
  isReversed: boolean;
  labels: ReferenceCaseStudyLabels;
  project: ReferenceCaseStudyContent;
};

export function ReferenceProjectCard({
  isReversed,
  labels,
  project,
}: ReferenceProjectCardProps) {
  const sectionId = REFERENCE_SECTION_IDS[project.imageKey];
  const titleId = `${sectionId}-title`;

  return (
    <section
      aria-labelledby={titleId}
      className={styles.projectCard}
      data-device={REFERENCE_IMAGE_DEVICE[project.imageKey]}
      data-reversed={isReversed}
      id={sectionId}
    >
      <header className={styles.projectHeader}>
        <EyebrowPill variant="subtle">{project.industry}</EyebrowPill>
        <h2 className={styles.projectTitle} id={titleId}>
          {project.title}
        </h2>
      </header>

      <div className={styles.projectStory}>
        <ReferenceCaseStory
          problem={project.problem}
          problemLabel={labels.problem}
          result={project.result}
          resultLabel={labels.result}
          solution={project.solution}
          solutionLabel={labels.solution}
          solutionSteps={project.scope}
          solutionStepsLabel={labels.scope}
        />
      </div>

      <div className={styles.projectMedia}>
        <ReferenceResultGallery
          imageKey={project.imageKey}
          label={labels.gallery}
          shots={project.shots}
        />
      </div>

      <div className={styles.projectActions}>
        <TextCta
          variant="quaternary"
          className={styles.projectLink}
          href={project.href}
          rel="noreferrer"
          target="_blank"
          {...analyticsAttributes(AnalyticsEventName.ReferenceOpened, {
            project: project.imageKey,
            target: AnalyticsTarget.External,
          })}
        >
          {project.linkLabel}
        </TextCta>
      </div>

      {project.testimonial ? (
        <ReferenceTestimonial
          authorName={project.testimonial.authorName}
          avatarAlt={project.testimonial.avatarAlt}
          avatarKey={project.testimonial.avatarKey}
          className={styles.projectTestimonial}
          collapseLabel={labels.collapseQuote}
          expandLabel={labels.expandQuote}
          highlight={project.testimonial.highlight}
          quote={project.testimonial.quote}
          role={project.testimonial.role}
        />
      ) : null}
    </section>
  );
}
