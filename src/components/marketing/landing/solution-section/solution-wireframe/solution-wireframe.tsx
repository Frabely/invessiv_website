import styles from "./solution-wireframe.module.css";

export function SolutionWireframe() {
  return (
    <div
      aria-hidden="true"
      className={styles.wireframe}
      data-reveal-item="true"
    >
      <svg
        className={styles.svg}
        fill="none"
        viewBox="0 0 480 640"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g
          className={styles.strokes}
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.5"
        >
          <rect
            className={styles.path}
            height="40"
            rx="3"
            width="440"
            x="20"
            y="20"
          />
          <line className={styles.path} x1="40" x2="120" y1="40" y2="40" />
          <line className={styles.path} x1="320" x2="360" y1="40" y2="40" />
          <line className={styles.path} x1="380" x2="440" y1="40" y2="40" />

          <line className={styles.path} x1="20" x2="380" y1="100" y2="100" />
          <line className={styles.path} x1="20" x2="320" y1="124" y2="124" />
          <line className={styles.path} x1="20" x2="260" y1="148" y2="148" />
          <line className={styles.path} x1="20" x2="380" y1="180" y2="180" />
          <line className={styles.path} x1="20" x2="320" y1="200" y2="200" />

          <line className={styles.path} x1="20" x2="380" y1="280" y2="280" />
          <line className={styles.path} x1="20" x2="200" y1="300" y2="300" />
          <line className={styles.path} x1="20" x2="240" y1="316" y2="316" />
          <rect
            className={styles.path}
            height="44"
            rx="22"
            width="200"
            x="240"
            y="320"
          />

          <line className={styles.path} x1="20" x2="200" y1="408" y2="408" />
          <rect
            className={styles.path}
            height="80"
            rx="4"
            width="200"
            x="20"
            y="420"
          />
          <rect
            className={styles.path}
            height="80"
            rx="4"
            width="200"
            x="240"
            y="420"
          />

          <line className={styles.path} x1="20" x2="200" y1="540" y2="540" />
          <line className={styles.path} x1="20" x2="380" y1="554" y2="554" />
          <line className={styles.path} x1="20" x2="320" y1="568" y2="568" />
          <line className={styles.path} x1="20" x2="260" y1="582" y2="582" />

          <line className={styles.path} x1="20" x2="460" y1="612" y2="612" />
        </g>

        <rect
          className={styles.cta}
          fill="var(--accent-solo)"
          height="44"
          rx="22"
          width="200"
          x="240"
          y="320"
        />
      </svg>
    </div>
  );
}
