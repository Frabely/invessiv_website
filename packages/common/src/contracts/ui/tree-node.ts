import { type ReactNode } from "react";

export type TreeNode = {
  id: string;
  label: string;
  /** Second line of the row. Null when the row carries no subtitle. */
  secondaryLabel: string | null;
  /** Kept apart from `children` so a node can announce children before they are loaded. */
  hasChildren: boolean;
  children: readonly TreeNode[];
};

export type TreeViewProps = {
  ariaLabel: string;
  /** Accessible label of the collapse button; `{label}` is replaced with the node label. */
  collapseLabelTemplate: string;
  /** Replaces the list while there is no node at all. */
  emptyState?: ReactNode;
  /** Accessible label of the expand button; `{label}` is replaced with the node label. */
  expandLabelTemplate: string;
  expandedIds: readonly string[];
  /** Nodes whose children the consumer is currently fetching. */
  loadingIds?: readonly string[];
  loadingLabel: string;
  nodes: readonly TreeNode[];
  /** Reports the state the node should take. Whether it happens is the consumer's decision. */
  onToggleAction: (nodeId: string, expanded: boolean) => void;
  /** Optional app-neutral content or metadata placed after a row label. `level` starts at 0. */
  renderRowContent?: (node: TreeNode, level: number) => ReactNode;
  /** Makes the label an independent selection control without coupling the tree to a domain. */
  onSelectAction?: (nodeId: string) => void;
  /** The currently selected node, rendered as a visual state only. */
  selectedNodeId?: string | null;
};
