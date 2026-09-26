import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "./portal-mock-dialog-content.module.css";

export type PortalMockDialogContentProps = {
  intro: string;
  upcoming: readonly string[];
};

/** Explains what a placeholder area will offer, without pretending any of it exists yet. */
export function PortalMockDialogContent({
  intro,
  upcoming,
}: PortalMockDialogContentProps) {
  return (
    <div className={styles.content}>
      <p className={styles.intro}>{intro}</p>
      <ul className={styles.list}>
        {upcoming.map((item) => (
          <li key={item}>
            <FontAwesomeIcon aria-hidden="true" icon={faCircleCheck} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
