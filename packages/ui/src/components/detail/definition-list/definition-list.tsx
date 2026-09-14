import type { ReactNode } from "react";
import styles from "./definition-list.module.css";

export type DefinitionListItemProps = { label: ReactNode; value: ReactNode };
export type DefinitionListProps = {
  children?: ReactNode;
  items?: readonly DefinitionListItemProps[];
};

export function DefinitionList({ children, items }: DefinitionListProps) {
  return (
    <dl className={styles.list}>
      {items?.map((item, index) => (
        <div className={styles.item} key={index}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
      {children}
    </dl>
  );
}

export function DefinitionListItem({ label, value }: DefinitionListItemProps) {
  return (
    <div className={styles.item}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
