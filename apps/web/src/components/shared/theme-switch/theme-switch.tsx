import type { Theme } from "@/lib/theme/theme";
import styles from "./theme-switch.module.css";
import { faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import { ActionIcon } from "@/components/shared/action-icon/action-icon";

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
          <ActionIcon icon={faMoon} />
        </span>
      </span>
      <span aria-hidden="true" className={styles.slot}>
        <span className={`${styles.icon} ${styles.iconSun}`}>
          <ActionIcon icon={faSun} />
        </span>
      </span>
    </button>
  );
}
