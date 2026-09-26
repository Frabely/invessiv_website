"use client";

import { type ReactNode, useId, useState } from "react";
import { faComments, faPaperPlane } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import type { ChatDockContent } from "@invessiv/common/contracts/ui/chat-dock-content";
import { ButtonControl } from "../button/button";
import styles from "./chat-dock.module.css";

export type ChatDockProps = {
  badgeLabel?: string;
  className?: string;
  content: ChatDockContent;
  expanded?: boolean;
  onExpandedChangeAction?: (expanded: boolean) => void;
  children?: ReactNode;
};

const SKELETON_BUBBLES = ["incoming", "outgoing", "incoming"] as const;

/**
 * The docking point for the customer chat (plan folders 17/18). Until then it is a visibly marked
 * mock: no messages, no sending and no unread indicator, so it never pretends a state that does not exist.
 */
export function ChatDock({
  badgeLabel,
  className,
  content,
  expanded: controlledExpanded,
  onExpandedChangeAction,
  children,
}: ChatDockProps) {
  const [localExpanded, setLocalExpanded] = useState(false);
  const expanded = controlledExpanded ?? localExpanded;
  const panelId = useId();
  const headingId = useId();
  const inputId = useId();
  const toggleLabel = expanded ? content.collapse : content.expand;

  return (
    <aside
      aria-labelledby={headingId}
      className={className ? `${styles.dock} ${className}` : styles.dock}
      data-expanded={expanded}
    >
      <ButtonControl
        aria-controls={panelId}
        aria-expanded={expanded}
        aria-label={toggleLabel}
        className={styles.rail}
        onClick={() => {
          if (controlledExpanded === undefined) setLocalExpanded(!expanded);
          onExpandedChangeAction?.(!expanded);
        }}
        title={toggleLabel}
        type="button"
        variant="ghost"
      >
        <FontAwesomeIcon aria-hidden="true" icon={faComments} />
      </ButtonControl>
      <div className={styles.panel} hidden={!expanded} id={panelId}>
        <header className={styles.head}>
          <h2 id={headingId}>{content.title}</h2>
          {badgeLabel ? (
            <span className={styles.badge}>{badgeLabel}</span>
          ) : null}
        </header>
        <p className={styles.readAlong}>{content.readAlong}</p>
        {children ?? (
          <>
            <div aria-hidden="true" className={styles.thread}>
              {SKELETON_BUBBLES.map((side, index) => (
                <span className={styles.bubble} data-side={side} key={index} />
              ))}
            </div>
            <p className={styles.body}>{content.body}</p>
            <form
              className={styles.composer}
              onSubmit={(event) => event.preventDefault()}
            >
              <label className="sr-only" htmlFor={inputId}>
                {content.inputLabel}
              </label>
              <input
                disabled
                id={inputId}
                placeholder={content.inputPlaceholder}
                type="text"
              />
              <ButtonControl
                aria-label={content.send}
                className={styles.send}
                disabled
                title={content.send}
                type="submit"
                variant="ghost"
              >
                <FontAwesomeIcon aria-hidden="true" icon={faPaperPlane} />
              </ButtonControl>
            </form>
          </>
        )}
      </div>
    </aside>
  );
}
