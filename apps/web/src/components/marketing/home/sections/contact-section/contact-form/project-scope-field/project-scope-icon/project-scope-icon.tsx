import { faCircleQuestion } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  CONTACT_PROJECT_SCOPE,
  type ContactProjectScope,
} from "@invessiv/common/constants/contact/contact-project-scopes";
import styles from "./project-scope-icon.module.css";

type ProjectScopeIconProps = {
  scope: ContactProjectScope;
};

export function ProjectScopeIcon({ scope }: ProjectScopeIconProps) {
  if (scope === CONTACT_PROJECT_SCOPE.Unsure) {
    return (
      <FontAwesomeIcon
        aria-hidden="true"
        className={styles.glyph}
        icon={faCircleQuestion}
      />
    );
  }

  return <span aria-hidden="true" className={styles.mask} data-scope={scope} />;
}
