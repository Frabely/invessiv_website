import styles from "./placeholder-section.module.css";

type PlaceholderSectionProps = {
  description: string;
  id: string;
  isTall?: boolean;
  title: string;
};

export function PlaceholderSection({
  description,
  id,
  isTall = false,
  title,
}: PlaceholderSectionProps) {
  const sectionClassName = isTall
    ? `${styles.section} ${styles.tall}`
    : styles.section;

  return (
    <section aria-labelledby={`${id}-title`} className={sectionClassName} id={id}>
      <h2 className={styles.title} id={`${id}-title`}>
        {title}
      </h2>
      <p className={styles.description}>{description}</p>
    </section>
  );
}
