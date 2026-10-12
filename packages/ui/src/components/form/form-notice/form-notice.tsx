import type { AriaRole, ReactNode } from "react";
import styles from "./form-notice.module.css";
export type FormNoticeProps = { children: ReactNode; role?: AriaRole };
export function FormNotice({ children, role = "alert" }: FormNoticeProps) {
  return (
    <p className={styles.notice} role={role}>
      {children}
    </p>
  );
}
