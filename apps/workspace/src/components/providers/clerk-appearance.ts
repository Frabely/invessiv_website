import styles from "./clerk-appearance.module.css";

/** CSS variables follow the active theme without remounting account forms. */
export function createClerkAppearance() {
  return {
    cssLayerName: "clerk",
    variables: {
      colorPrimary: "var(--color-cta)",
      colorBackground: "var(--color-surface-1)",
      colorForeground: "var(--color-text)",
      colorMutedForeground: "var(--color-text-muted)",
      colorInput: "var(--color-surface-2)",
      colorInputForeground: "var(--color-text)",
      colorDanger: "var(--color-danger)",
      colorSuccess: "var(--color-success)",
      colorBorder: "var(--control-border-color)",
      fontFamily: "var(--font-family-base)",
      fontFamilyButtons: "var(--font-family-base)",
      borderRadius: "var(--control-radius)",
    },
    elements: {
      formButtonPrimary: styles.primary,
      formButtonReset: styles.secondary,
      socialButtonsBlockButton: styles.secondary,
      profileSectionPrimaryButton: styles.textAction,
      userButtonPopoverActionButton: styles.menuAction,
      navbarButton: styles.menuAction,
      avatarBox: styles.avatar,
      formField: styles.field,
      formFieldInputGroup: styles.inputShell,
      formFieldInput: styles.input,
    },
  };
}
