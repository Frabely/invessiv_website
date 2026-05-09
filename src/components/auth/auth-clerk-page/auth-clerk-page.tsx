import type { ReactNode } from "react";
import type { AuthContent } from "@/i18n/dictionaries/auth";
import styles from "./auth-clerk-page.module.css";

type AuthPageContent = AuthContent["signIn"];

type AuthClerkPageProps = {
  children: ReactNode;
  content: AuthPageContent;
  footerHref: string;
};

export function AuthClerkPage({
  children,
  content,
  footerHref,
}: AuthClerkPageProps) {
  return (
    <section className={styles.section}>
      <header className={styles.header}>
        <h1 className={styles.headline}>{content.headline}</h1>
        <p className={styles.subline}>{content.subline}</p>
      </header>
      {children}
      <p className={styles.footer}>
        {content.footer.promptText}{" "}
        <a className={styles.footerLink} href={footerHref}>
          {content.footer.linkText}
        </a>
      </p>
    </section>
  );
}
