"use client";

import { useId } from "react";
import type {
  TreeNode,
  TreeViewProps,
} from "@invessiv/common/contracts/ui/tree-node";
import styles from "./tree-view.module.css";

type SharedProps = Pick<
  TreeViewProps,
  | "collapseLabelTemplate"
  | "expandLabelTemplate"
  | "expandedIds"
  | "loadingLabel"
  | "onToggleAction"
  | "renderRowActions"
> & {
  idPrefix: string;
  loadingIds: readonly string[];
};

function formatLabel(template: string, label: string) {
  return template.replace("{label}", label);
}

function TreeLevel({
  ariaLabel,
  level,
  listId,
  nodes,
  shared,
}: {
  ariaLabel: string;
  level: number;
  listId?: string;
  nodes: readonly TreeNode[];
  shared: SharedProps;
}) {
  return (
    <ul
      aria-label={ariaLabel}
      className={styles.list}
      data-level={level}
      id={listId}
    >
      {nodes.map((node) => (
        <TreeItem key={node.id} level={level} node={node} shared={shared} />
      ))}
    </ul>
  );
}

function TreeItem({
  level,
  node,
  shared,
}: {
  level: number;
  node: TreeNode;
  shared: SharedProps;
}) {
  const expanded = shared.expandedIds.includes(node.id);
  const childListId = `${shared.idPrefix}-${node.id}`;
  const showsChildren = expanded && node.children.length > 0;

  return (
    <li className={styles.item}>
      <div className={styles.row} data-level={level}>
        {node.hasChildren ? (
          <button
            aria-controls={showsChildren ? childListId : undefined}
            aria-expanded={expanded}
            className={styles.toggle}
            onClick={() => shared.onToggleAction(node.id, !expanded)}
            type="button"
          >
            <span aria-hidden="true" className={styles.toggleIcon} />
            <span className={styles.visuallyHidden}>
              {formatLabel(
                expanded
                  ? shared.collapseLabelTemplate
                  : shared.expandLabelTemplate,
                node.label,
              )}
            </span>
          </button>
        ) : (
          <span aria-hidden="true" className={styles.toggleSpacer} />
        )}
        <span className={styles.labels}>
          <span className={styles.label}>{node.label}</span>
          {node.secondaryLabel === null ? null : (
            <span className={styles.secondaryLabel}>{node.secondaryLabel}</span>
          )}
        </span>
        <span className={styles.actions}>
          {shared.renderRowActions(node, level)}
        </span>
      </div>
      {shared.loadingIds.includes(node.id) ? (
        <p className={styles.loading}>{shared.loadingLabel}</p>
      ) : null}
      {showsChildren ? (
        <TreeLevel
          ariaLabel={node.label}
          level={level + 1}
          listId={childListId}
          nodes={node.children}
          shared={shared}
        />
      ) : null}
    </li>
  );
}

/**
 * Controlled disclosure tree. Renders nested lists with disclosure buttons, not an ARIA `tree`:
 * rows carry several controls, and a real tree would force cell navigation onto them. Expansion
 * and children come from the consumer; row content comes from `renderRowActions`.
 */
export function TreeView({
  ariaLabel,
  collapseLabelTemplate,
  emptyState,
  expandLabelTemplate,
  expandedIds,
  loadingIds = [],
  loadingLabel,
  nodes,
  onToggleAction,
  renderRowActions,
}: TreeViewProps) {
  const idPrefix = useId();

  if (nodes.length === 0) {
    return emptyState ?? null;
  }

  return (
    <TreeLevel
      ariaLabel={ariaLabel}
      level={0}
      nodes={nodes}
      shared={{
        collapseLabelTemplate,
        expandLabelTemplate,
        expandedIds,
        idPrefix,
        loadingIds,
        loadingLabel,
        onToggleAction,
        renderRowActions,
      }}
    />
  );
}
