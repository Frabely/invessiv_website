import type { ContactProjectScope } from "@invessiv/common/constants/contact/contact-project-scopes";
import styles from "./project-scope-icon.module.css";

type ProjectScopeIconProps = {
  scope: ContactProjectScope;
};

export function ProjectScopeIcon({ scope }: ProjectScopeIconProps) {
  return <span aria-hidden="true" className={styles.mask} data-scope={scope} />;
}
