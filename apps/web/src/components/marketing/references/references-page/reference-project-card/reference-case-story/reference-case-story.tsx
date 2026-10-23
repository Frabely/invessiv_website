import styles from "./reference-case-story.module.css";

type ReferenceCaseStoryProps = {
  problem: string;
  problemLabel: string;
  result: string;
  resultLabel: string;
  solution: string;
  solutionLabel: string;
  solutionSteps: string[];
  solutionStepsLabel: string;
};

type StoryRow = {
  label: string;
  steps?: string[];
  text: string;
};

export function ReferenceCaseStory({
  problem,
  problemLabel,
  result,
  resultLabel,
  solution,
  solutionLabel,
  solutionSteps,
  solutionStepsLabel,
}: ReferenceCaseStoryProps) {
  const rows: StoryRow[] = [
    { label: problemLabel, text: problem },
    { label: solutionLabel, steps: solutionSteps, text: solution },
    { label: resultLabel, text: result },
  ];

  return (
    <dl className={styles.story}>
      {rows.map((row) => (
        <div className={styles.row} key={row.label}>
          <dt className={styles.label}>{row.label}</dt>
          <dd className={styles.body}>
            <p className={styles.text}>{row.text}</p>
            {row.steps?.length ? (
              <ul aria-label={solutionStepsLabel} className={styles.steps}>
                {row.steps.map((step) => (
                  <li className={styles.step} key={step}>
                    {step}
                  </li>
                ))}
              </ul>
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}
