import type { Theme } from "@/lib/theme/theme";
import styles from "./theme-switch.module.css";

type ThemeSwitchCopy = {
  actionLabel: string;
};

type ThemeSwitchProps = {
  className?: string;
  copy: ThemeSwitchCopy;
  onToggle: () => void;
  theme: Theme;
  variant?: "desktop" | "mobile";
};

export function ThemeSwitch({
  className,
  copy,
  onToggle,
  theme,
  variant = "desktop",
}: ThemeSwitchProps) {
  const rootClassName = className
    ? `${styles.switch} ${styles[variant]} ${className}`
    : `${styles.switch} ${styles[variant]}`;

  return (
    <button
      aria-label={copy.actionLabel}
      className={rootClassName}
      data-theme-state={theme}
      onClick={onToggle}
      type="button"
    >
      <span aria-hidden="true" className={styles.highlight} />
      <span aria-hidden="true" className={styles.slot}>
        <span className={`${styles.icon} ${styles.iconMoon}`}>
          <svg fill="none" viewBox="0 0 24 24">
            <path d="M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a7.1 7.1 0 0 0 10.7 10.7Z" />
          </svg>
        </span>
      </span>
      <span aria-hidden="true" className={styles.slot}>
        <span className={`${styles.icon} ${styles.iconSun}`}>
          <svg fill="none" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="4.2" />
            <path d="M12 2.5v2.2M12 19.3v2.2M4.7 4.7l1.6 1.6M17.7 17.7l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.7 19.3l1.6-1.6M17.7 6.3l1.6-1.6" />
          </svg>
        </span>
      </span>
    </button>
  );
}
