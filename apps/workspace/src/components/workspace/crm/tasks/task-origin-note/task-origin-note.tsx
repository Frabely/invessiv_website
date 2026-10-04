import { faArrowRightToBracket } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import styles from "./task-origin-note.module.css";

type TaskOriginNoteProps = {
  label: string;
};

/** Marks a task a customer contact created in the portal, wherever the task is listed or edited. */
export function TaskOriginNote({ label }: TaskOriginNoteProps) {
  return (
    <span className={styles.note}>
      <FontAwesomeIcon aria-hidden="true" icon={faArrowRightToBracket} />
      {label}
    </span>
  );
}
