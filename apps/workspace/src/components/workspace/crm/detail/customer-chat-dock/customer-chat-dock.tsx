"use client";

import { useId, useState } from "react";
import {
  faChevronLeft,
  faComments,
  faPaperPlane,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import type { CrmCockpitDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./customer-chat-dock.module.css";

type CustomerChatDockProps = {
  badgeLabel: string;
  className?: string;
  content: CrmCockpitDictionary["chat"];
};

const SKELETON_BUBBLES = ["incoming", "outgoing", "incoming"] as const;

/**
 * The docking point for the customer chat (plan folders 17/18). Until then it is a visibly marked
 * mock: no messages, no sending and no unread indicator, so it never pretends a state that does not exist.
 */
export function CustomerChatDock({
  badgeLabel,
  className,
  content,
}: CustomerChatDockProps) {
  const [expanded, setExpanded] = useState(false);
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
      <button
        aria-controls={panelId}
        aria-expanded={expanded}
        aria-label={toggleLabel}
        className={styles.rail}
        onClick={() => setExpanded((current) => !current)}
        title={toggleLabel}
        type="button"
      >
        <FontAwesomeIcon aria-hidden="true" icon={faComments} />
        <span aria-hidden="true" className={styles.railLabel}>
          {content.title}
        </span>
        {/* A real unread indicator attaches here once conversation reads exist (plan folder 17). */}
        <FontAwesomeIcon
          aria-hidden="true"
          className={styles.railChevron}
          icon={faChevronLeft}
        />
      </button>
      <div className={styles.panel} hidden={!expanded} id={panelId}>
        <header className={styles.head}>
          <h2 id={headingId}>{content.title}</h2>
          <span className={styles.badge}>{badgeLabel}</span>
        </header>
        <p className={styles.readAlong}>{content.readAlong}</p>
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
          <button
            aria-label={content.send}
            className={styles.send}
            disabled
            title={content.send}
            type="submit"
          >
            <FontAwesomeIcon aria-hidden="true" icon={faPaperPlane} />
          </button>
        </form>
      </div>
    </aside>
  );
}
