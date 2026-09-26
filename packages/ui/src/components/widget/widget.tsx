"use client";

import { type ReactNode, useId, useState } from "react";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import {
  faArrowUpRightFromSquare,
  faChevronDown,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { WidgetOpenMode } from "@invessiv/common/constants/ui/widget-open-modes";
import { ButtonControl } from "../button/button";
import styles from "./widget.module.css";

type WidgetBaseProps = {
  title: string;
  icon?: IconDefinition;
  /** Shown as a quiet counter next to the title. */
  count?: number;
  /** Secondary line below the title, e.g. a project label or a due hint. */
  meta?: ReactNode;
  /** Marks the widget as a placeholder; the body must stay illustrative and show no invented values. */
  mock?: { badgeLabel: string };
  footer?: ReactNode;
  /** Summary body. */
  children: ReactNode;
  headingLevel?: 2 | 3;
  className?: string;
};

type WidgetStaticProps = WidgetBaseProps & {
  openMode: typeof WidgetOpenMode.None;
};

type WidgetDialogProps = WidgetBaseProps & {
  openMode: typeof WidgetOpenMode.Dialog;
  openLabel: string;
  onOpenAction: () => void;
  /**
   * Stretches the open button over the whole card. Only for widgets without interactive children,
   * otherwise nested controls would sit on top of another control.
   */
  wholeCardClickable?: boolean;
};

type WidgetDockProps = WidgetBaseProps & {
  openMode: typeof WidgetOpenMode.Dock;
  openLabel: string;
  onOpenAction: () => void;
  /** Id of the dock panel the trigger opens. */
  controlsId: string;
  /** Whether the dock is currently open. */
  expanded: boolean;
  /** See `WidgetDialogProps.wholeCardClickable`. */
  wholeCardClickable?: boolean;
};

type WidgetExpandProps = WidgetBaseProps & {
  openMode: typeof WidgetOpenMode.Expand;
  openLabel: string;
  closeLabel: string;
  /** Rendered below the summary while expanded. */
  expandedContent: ReactNode;
  /** Controlled state; omit for uncontrolled use. */
  expanded?: boolean;
  onExpandedChangeAction?: (expanded: boolean) => void;
};

export type WidgetProps =
  WidgetStaticProps | WidgetDialogProps | WidgetDockProps | WidgetExpandProps;

/**
 * App-neutral dashboard card. The open action is always an explicit button; widgets whose body
 * holds no interactive content may stretch it over the whole card via `wholeCardClickable`.
 */
export function Widget(props: WidgetProps) {
  const {
    title,
    icon,
    count,
    meta,
    mock,
    footer,
    children,
    headingLevel = 2,
    className,
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

  return (
    <section
      aria-labelledby={headingId}
      className={className ? `${styles.widget} ${className}` : styles.widget}
      data-expanded={isExpandMode ? expanded : undefined}
      data-mock={mock ? true : undefined}
      data-open-mode={props.openMode}
      data-whole-card={wholeCardClickable || undefined}
    >
      <header className={styles.header}>
        <div className={styles.heading}>
          {icon ? (
            <span aria-hidden="true" className={styles.icon}>
              <FontAwesomeIcon icon={icon} />
            </span>
          ) : null}
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
        </div>
        {mock ? (
          <span className={styles.mockBadge}>{mock.badgeLabel}</span>
        ) : null}
        {props.openMode === WidgetOpenMode.Dialog ? (
          <ButtonControl
            aria-haspopup="dialog"
            className={styles.openButton}
            onClick={props.onOpenAction}
            type="button"
            variant="ghost"
          >
            <span>{props.openLabel}</span>
            <FontAwesomeIcon
              aria-hidden="true"
              icon={faArrowUpRightFromSquare}
            />
          </ButtonControl>
        ) : null}
        {props.openMode === WidgetOpenMode.Dock ? (
          <ButtonControl
            aria-controls={props.controlsId}
            aria-expanded={props.expanded}
            className={styles.openButton}
            onClick={props.onOpenAction}
            type="button"
            variant="ghost"
          >
            <span>{props.openLabel}</span>
            <FontAwesomeIcon
              aria-hidden="true"
              icon={faArrowUpRightFromSquare}
            />
          </ButtonControl>
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
      {footer || isExpandMode ? (
        <footer className={styles.footer}>
          {footer}
          {isExpandMode ? (
            <ButtonControl
              aria-controls={expandedRegionId}
              aria-expanded={expanded}
              className={styles.toggleButton}
              onClick={() => {
                if (props.expanded === undefined) setLocalExpanded(!expanded);
                props.onExpandedChangeAction?.(!expanded);
              }}
              type="button"
              variant="ghost"
            >
              <span>{expanded ? props.closeLabel : props.openLabel}</span>
              <FontAwesomeIcon
                aria-hidden="true"
                className={styles.chevron}
                icon={faChevronDown}
              />
            </ButtonControl>
          ) : null}
        </footer>
      ) : null}
    </section>
  );
}
