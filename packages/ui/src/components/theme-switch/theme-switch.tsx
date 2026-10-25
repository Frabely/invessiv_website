import { faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import type { ColorTheme } from "@invessiv/common/constants/ui/color-themes";
import {
  HeaderControlVariant,
  type HeaderControlVariant as HeaderControlVariantValue,
} from "@invessiv/common/constants/ui/header-control-variants";
import { ActionIcon } from "../action-icon/action-icon";
import styles from "./theme-switch.module.css";

type ThemeSwitchCopy = {
  actionLabel: string;
};

export type ThemeSwitchProps = {
  className?: string;
  copy: ThemeSwitchCopy;
  onToggle: () => void;
  theme: ColorTheme;
  variant?: HeaderControlVariantValue;
};

export function ThemeSwitch({
  className,
  copy,
  onToggle,
  theme,
  variant = HeaderControlVariant.Desktop,
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
