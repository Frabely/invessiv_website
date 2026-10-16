"use client";

import { type ComponentType, type ReactNode, useId, useState } from "react";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faArrowRight,
  faChevronDown,
  faTableColumns,
  faUpRightAndDownLeftFromCenter,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ButtonSize } from "@invessiv/common/constants/ui/button-sizes";
import { ButtonVariant } from "@invessiv/common/constants/ui/button-variants";
import type { WidgetAccent } from "@invessiv/common/constants/ui/widget-accents";
import { WidgetOpenMode } from "@invessiv/common/constants/ui/widget-open-modes";
import type { ButtonLinkComponentProps } from "@invessiv/common/contracts/ui/button-link-component-props";
import { ButtonControl, ButtonLink } from "../button/button";
import styles from "./widget.module.css";

type WidgetBaseProps = {
  title: string;
  /** Drawn on the tab that rises above the card's top edge. */
  icon?: IconDefinition;
  /** Colour of tab, counter and frame; the app defines one token per accent. */
  accent?: WidgetAccent;
  /** Shown as a counter next to the title. */
  count?: number;
  /** Secondary line below the title, e.g. a project label or a due hint. */
  meta?: ReactNode;
  /** Marks the widget as a placeholder; the body must stay illustrative and show no invented values. */
  mock?: { badgeLabel: string };
  /** Further actions or notes, placed in the action row before the open action. */
  footer?: ReactNode;
  /** Summary body. */
  children: ReactNode;
  headingLevel?: 2 | 3;
  className?: string;
};

type WidgetStaticProps = WidgetBaseProps & {
  openMode: typeof WidgetOpenMode.None;
};

/** What every open action shares: its text and whether it is the reader's next step. */
type WidgetOpenActionProps = {
  openLabel: string;
  /** Turns the open action into the primary button, e.g. while it is the reader's turn. */
  openProminent?: boolean;
};

type WidgetDialogProps = WidgetBaseProps &
  WidgetOpenActionProps & {
    openMode: typeof WidgetOpenMode.Dialog;
    onOpenAction: () => void;
    /** Disables the dialog trigger while keeping its label and the summary visible. */
    openDisabled?: boolean;
    /**
     * Stretches the open button over the whole card. Only for widgets without interactive children,
     * otherwise nested controls would sit on top of another control.
     */
    wholeCardClickable?: boolean;
  };

type WidgetDockProps = WidgetBaseProps &
  WidgetOpenActionProps & {
    openMode: typeof WidgetOpenMode.Dock;
    onOpenAction: () => void;
    /** Id of the dock panel the trigger opens. */
    controlsId: string;
    /** Whether the dock is currently open. */
    expanded: boolean;
    /** See `WidgetDialogProps.wholeCardClickable`. */
    wholeCardClickable?: boolean;
  };

type WidgetPageProps = WidgetBaseProps &
  WidgetOpenActionProps & {
    openMode: typeof WidgetOpenMode.Page;
    href: string;
    /** Accessible name when the visible label alone is ambiguous, e.g. it omits the project. */
    openAccessibleLabel?: string;
    /** Framework link, e.g. Next.js `Link`; a plain anchor without it. */
    linkComponent?: ComponentType<ButtonLinkComponentProps>;
  };

type WidgetExpandProps = WidgetBaseProps &
  WidgetOpenActionProps & {
    openMode: typeof WidgetOpenMode.Expand;
    closeLabel: string;
    /** Rendered below the summary while expanded. */
    expandedContent: ReactNode;
    /** Controlled state; omit for uncontrolled use. */
    expanded?: boolean;
    onExpandedChangeAction?: (expanded: boolean) => void;
  };

export type WidgetProps =
  | WidgetStaticProps
  | WidgetDialogProps
  | WidgetDockProps
  | WidgetPageProps
  | WidgetExpandProps;

/**
 * App-neutral dashboard card. Its icon rides on a coloured tab above the top edge; the open action
 * always sits at the end of the action row, and its trailing icon says what happens: an arrow leads
 * to a page, the corner arrows open a dialog, the columns a side panel, the chevron unfolds the card.
 */
export function Widget(props: WidgetProps) {
  const {
    accent,
    children,
    className,
    count,
    footer,
    headingLevel = 2,
    icon,
    meta,
    mock,
    title,
  } = props;
  const headingId = useId();
  const expandedRegionId = useId();
  const [localExpanded, setLocalExpanded] = useState(false);
  const Heading = headingLevel === 2 ? "h2" : "h3";

  const isExpandMode = props.openMode === WidgetOpenMode.Expand;
  const expanded = isExpandMode
    ? (props.expanded ?? localExpanded)
    : props.openMode === WidgetOpenMode.Dock
      ? props.expanded
      : false;
  const wholeCardClickable =
    (props.openMode === WidgetOpenMode.Dialog ||
      props.openMode === WidgetOpenMode.Dock) &&
    props.wholeCardClickable === true;
  const openProminent =
    props.openMode !== WidgetOpenMode.None && props.openProminent === true;
  const openAction = renderOpenAction(props, expanded, expandedRegionId, () => {
    if (props.openMode !== WidgetOpenMode.Expand) return;
    if (props.expanded === undefined) setLocalExpanded(!expanded);
    props.onExpandedChangeAction?.(!expanded);
  });

  return (
    <section
      aria-labelledby={headingId}
      className={className ? `${styles.widget} ${className}` : styles.widget}
      data-accent={accent}
      data-expanded={isExpandMode ? expanded : undefined}
      data-mock={mock ? true : undefined}
      data-open-mode={props.openMode}
      data-open-prominent={openProminent || undefined}
      data-tab={icon ? true : undefined}
      data-whole-card={wholeCardClickable || undefined}
    >
      {icon ? (
        <span aria-hidden="true" className={styles.tab}>
          <FontAwesomeIcon icon={icon} />
        </span>
      ) : null}
      <header className={styles.header}>
        <div className={styles.titleBlock}>
          <Heading className={styles.title} id={headingId}>
            <span>{title}</span>
            {count === undefined ? null : (
              <>
                {" "}
                <span className={styles.count}>{count}</span>
              </>
            )}
          </Heading>
          {meta ? <div className={styles.meta}>{meta}</div> : null}
        </div>
        {mock ? (
          <span className={styles.mockBadge}>{mock.badgeLabel}</span>
        ) : null}
      </header>
      <div className={styles.body}>{children}</div>
      {isExpandMode ? (
        <div
          className={styles.expanded}
          hidden={!expanded}
          id={expandedRegionId}
        >
          {props.expandedContent}
        </div>
      ) : null}
      {footer || openAction ? (
        <footer className={styles.footer}>
          {footer}
          {openAction}
        </footer>
      ) : null}
    </section>
  );
}

function renderOpenAction(
  props: WidgetProps,
  expanded: boolean,
  expandedRegionId: string,
  toggleExpanded: () => void,
): ReactNode {
  if (props.openMode === WidgetOpenMode.None) return null;

  const variant = props.openProminent
    ? ButtonVariant.Primary
    : ButtonVariant.Ghost;

  if (props.openMode === WidgetOpenMode.Page) {
    return (
      <ButtonLink
        aria-label={props.openAccessibleLabel}
        className={styles.openAction}
        href={props.href}
        linkComponent={props.linkComponent}
        size={ButtonSize.Control}
        variant={variant}
      >
        <span>{props.openLabel}</span>
        <FontAwesomeIcon aria-hidden="true" icon={faArrowRight} />
      </ButtonLink>
    );
  }

  if (props.openMode === WidgetOpenMode.Expand) {
    return (
      <ButtonControl
        aria-controls={expandedRegionId}
        aria-expanded={expanded}
        className={styles.openAction}
        onClick={toggleExpanded}
        size={ButtonSize.Control}
        type="button"
        variant={variant}
      >
        <span>{expanded ? props.closeLabel : props.openLabel}</span>
        <FontAwesomeIcon
          aria-hidden="true"
          className={styles.chevron}
          icon={faChevronDown}
        />
      </ButtonControl>
    );
  }

  if (props.openMode === WidgetOpenMode.Dock) {
    return (
      <ButtonControl
        aria-controls={props.controlsId}
        aria-expanded={props.expanded}
        className={styles.openAction}
        onClick={props.onOpenAction}
        size={ButtonSize.Control}
        type="button"
        variant={variant}
      >
        <span>{props.openLabel}</span>
        <FontAwesomeIcon aria-hidden="true" icon={faTableColumns} />
      </ButtonControl>
    );
  }

  return (
    <ButtonControl
      aria-haspopup="dialog"
      className={styles.openAction}
      disabled={props.openDisabled}
      onClick={props.onOpenAction}
      size={ButtonSize.Control}
      type="button"
      variant={variant}
    >
      <span>{props.openLabel}</span>
      <FontAwesomeIcon
        aria-hidden="true"
        icon={faUpRightAndDownLeftFromCenter}
      />
    </ButtonControl>
  );
}
