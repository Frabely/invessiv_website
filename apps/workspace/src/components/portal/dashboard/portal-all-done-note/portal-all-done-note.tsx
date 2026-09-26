import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "./portal-all-done-note.module.css";

export type PortalAllDoneNoteProps = {
  text: string;
};

/** Nothing left to do is good news, so it is confirmed instead of shown as an empty list. */
export function PortalAllDoneNote({ text }: PortalAllDoneNoteProps) {
  return (
    <p className={styles.note}>
      <FontAwesomeIcon aria-hidden="true" icon={faCircleCheck} />
      {text}
    </p>
  );
}
