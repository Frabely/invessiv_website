import { REFERENCE_IMAGE_DEVICE } from "@/common/constants/marketing/reference-image-device";
import { REFERENCE_SECTION_IDS } from "@/common/constants/marketing/reference-section-ids";
import type { ReferenceLabels } from "@/common/contracts/marketing/reference-labels";
import { ReferenceTestimonial } from "@/components/marketing/shared/reference-testimonial/reference-testimonial";
import type { ReferencesCaseStudyContent } from "@/i18n/dictionaries/marketing/references";
import { ReferenceProjectFrame } from "./reference-project-frame/reference-project-frame";
import styles from "./reference-project-card.module.css";

type ReferenceProjectCardProps = {
  isPriorityMedia: boolean;
  project: ReferencesCaseStudyContent;
  testimonialLabels: Pick<ReferenceLabels, "collapseQuote" | "expandQuote">;
};

export function ReferenceProjectCard({
  isPriorityMedia,
  project,
  testimonialLabels,
}: ReferenceProjectCardProps) {
  const sectionId = REFERENCE_SECTION_IDS[project.imageKey];
  const titleId = `${sectionId}-title`;

  return (
    <section
      aria-labelledby={titleId}
      className={styles.projectCard}
      data-device={REFERENCE_IMAGE_DEVICE[project.imageKey]}
      id={sectionId}
    >
      <div className={styles.projectLead}>
        <div className={styles.projectHeader}>
          <div className={styles.projectMetaLine}>
            <p className={styles.projectKicker}>{project.kicker}</p>
            <span aria-hidden="true" className={styles.projectMetaDivider} />
            <p className={styles.projectCategory}>{project.category}</p>
          </div>
        </div>

        <h2 className={styles.projectTitle} id={titleId}>
          {project.title}
        </h2>
        <p className={styles.projectSummary}>{project.summary}</p>

        <div className={styles.focusBlock}>
          <p className={styles.detailLabel}>{project.focusLabel}</p>
          <p className={styles.focusText}>{project.focus}</p>
        </div>

        <a
          className={styles.projectLink}
          href={project.href}
          rel="noreferrer"
          target="_blank"
        >
          {project.linkLabel}
        </a>

        {project.testimonial ? (
          <ReferenceTestimonial
            authorName={project.testimonial.authorName}
            avatarAlt={project.testimonial.avatarAlt}
            avatarKey={project.testimonial.avatarKey}
            className={styles.projectTestimonial}
            collapseLabel={testimonialLabels.collapseQuote}
            expandLabel={testimonialLabels.expandQuote}
            quote={project.testimonial.quote}
            role={project.testimonial.role}
          />
        ) : null}
      </div>

      <div
        className={styles.projectMediaColumn}
        data-device={REFERENCE_IMAGE_DEVICE[project.imageKey]}
      >
        <div className={styles.projectVisual}>
          <ReferenceProjectFrame
            imageAlt={project.imageAlt}
            imageKey={project.imageKey}
            priority={isPriorityMedia}
          />
        </div>

        <div className={styles.projectMeta}>
          <div className={styles.detailBlock}>
            <p className={styles.detailLabel}>{project.deliverablesLabel}</p>
            <ul className={styles.detailList}>
              {project.deliverables.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className={styles.detailBlock}>
            <p className={styles.detailLabel}>{project.outcomesLabel}</p>
            <ul className={styles.detailList}>
              {project.outcomes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
