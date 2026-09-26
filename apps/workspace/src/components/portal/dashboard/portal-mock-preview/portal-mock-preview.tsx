import styles from "./portal-mock-preview.module.css";

export type PortalMockPreviewProps = {
  /** Number of placeholder rows; they illustrate the shape, never a value. */
  rows?: number;
  teaser: string;
};

/** Static shapes on purpose: a pulsing skeleton would suggest data that is about to load. */
export function PortalMockPreview({
  rows = 2,
  teaser,
}: PortalMockPreviewProps) {
  return (
    <div className={styles.preview}>
      <p className={styles.teaser}>{teaser}</p>
      <div aria-hidden="true" className={styles.rows}>
        {Array.from({ length: rows }, (_, index) => (
          <span className={styles.row} key={index}>
            <span className={styles.dot} />
            <span className={styles.line} />
          </span>
        ))}
      </div>
    </div>
  );
}
