import type { WorkspacePageContent } from "@/i18n/dictionaries/workspace";
import styles from "./workspace-search.module.css";

type WorkspaceSearchProps = {
  content: WorkspacePageContent["shell"]["header"]["search"];
};

const SEARCH_HINT_ID = "workspace-search-disabled-hint";
const SEARCH_INPUT_ID = "workspace-search-input";

export function WorkspaceSearch({ content }: WorkspaceSearchProps) {
  return (
    <form
      aria-label={content.label}
      className={styles.root}
      role="search"
      title={content.disabledHint}
    >
      <label className="sr-only" htmlFor={SEARCH_INPUT_ID}>
        {content.label}
      </label>
      <span aria-hidden="true" className={styles.icon}>
        <svg
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4.35-4.35" />
        </svg>
      </span>
      <input
        aria-describedby={SEARCH_HINT_ID}
        aria-disabled="true"
        className={styles.input}
        disabled
        id={SEARCH_INPUT_ID}
        placeholder={content.placeholder}
        tabIndex={-1}
        type="search"
      />
      <span aria-hidden="true" className={styles.badge}>
        {content.comingSoonBadge}
      </span>
      <span className="sr-only" id={SEARCH_HINT_ID}>
        {content.disabledHint}
      </span>
    </form>
  );
}
