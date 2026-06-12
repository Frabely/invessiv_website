import {
  faArrowLeftLong,
  faCalendarCheck,
  faCheck,
  faCheckDouble,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ButtonLink, PrimaryCtaLink } from "@/components/shared/button/button";
import type { SuccessPageContent } from "@/i18n/dictionaries/shared/success-page";
import styles from "./success-page.module.css";

type SuccessPageProps = SuccessPageContent & {
  backHref: string;
  contactHref: string;
};

export function SuccessPage({
  backHref,
  backLabel,
  body,
  contactHref,
  contactLabel,
  contactLead,
  statusLabel,
  steps,
  stepsLabel,
  title,
}: SuccessPageProps) {
  return (
    <section className={styles.page}>
      <span aria-hidden="true" className={styles.glow} />

      <span aria-hidden="true" className={styles.seal}>
        <span className={styles.sealPulse} />
        <span className={styles.sealPulseLate} />
        <span className={styles.sealDisc}>
          <FontAwesomeIcon className={styles.sealCheck} icon={faCheck} />
        </span>
      </span>

      <p className={styles.status}>
        <FontAwesomeIcon
          aria-hidden="true"
          className={styles.statusChecks}
          icon={faCheckDouble}
        />
        <span>{statusLabel}</span>
      </p>

      <h1 className={styles.title}>{title}</h1>
      <p className={styles.body}>{body}</p>

      <div className={styles.stepsCard}>
        <h2 className={styles.stepsLabel}>{stepsLabel}</h2>
        <ol className={styles.steps}>
          {steps.map((step, index) => (
            <li className={styles.step} key={step.title}>
              <span aria-hidden="true" className={styles.stepNumeral}>
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className={styles.stepText}>
                <span className={styles.stepTitle}>{step.title}</span>
                <span className={styles.stepBody}>{step.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className={styles.contact}>
        <p className={styles.contactLead}>{contactLead}</p>
        <div className={styles.actions}>
          <ButtonLink className={styles.back} href={backHref} variant="ghost">
            <FontAwesomeIcon
              aria-hidden="true"
              className={styles.backArrow}
              icon={faArrowLeftLong}
            />
            <span>{backLabel}</span>
          </ButtonLink>
          <PrimaryCtaLink
            className={styles.contactLink}
            href={contactHref}
            rel="noreferrer"
            target="_blank"
          >
            <FontAwesomeIcon
              aria-hidden="true"
              className={styles.contactIcon}
              icon={faCalendarCheck}
            />
            <span>{contactLabel}</span>
          </PrimaryCtaLink>
        </div>
      </div>
    </section>
  );
}
