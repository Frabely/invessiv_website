import styles from "./reference-case-story.module.css";

type ReferenceCaseStoryProps = {
  problem: string;
  problemLabel: string;
  result: string;
  resultLabel: string;
  solution: string;
  solutionLabel: string;
};

export function ReferenceCaseStory({
  problem,
  problemLabel,
  result,
  resultLabel,
  solution,
  solutionLabel,
}: ReferenceCaseStoryProps) {
  const rows = [
    { label: problemLabel, text: problem },
    { label: solutionLabel, text: solution },
    { label: resultLabel, text: result },
  ];

  return (
    <dl className={styles.story}>
      {rows.map((row) => (
        <div className={styles.row} key={row.label}>
          <dt className={styles.label}>{row.label}</dt>
          <dd className={styles.text}>{row.text}</dd>
        </div>
      ))}
    </dl>
  );
}
