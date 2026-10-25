import type { ReactNode } from "react";
import styles from "./gradient-text.module.css";

type GradientTextProps = {
  children: ReactNode;
  className?: string;
};

export function GradientText({ children, className }: GradientTextProps) {
  return (
    <span className={[styles.text, className].filter(Boolean).join(" ")}>
      {children}
    </span>
  );
}
