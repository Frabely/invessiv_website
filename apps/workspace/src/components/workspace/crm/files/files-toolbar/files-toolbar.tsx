"use client";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ASSET_KIND_VALUES } from "@invessiv/common/constants/files/asset-kind";
import { FILE_ORIGIN_VALUES } from "@invessiv/common/constants/files/file-origin";
import { CUSTOMER_WIDE_FILES_FILTER } from "@/common/constants/crm/files/customer-files-query-params";
import type { CustomerFilesFilter } from "@/common/contracts/crm/files/customer-files-filter";
import type { FilesProjectOption } from "@/common/contracts/crm/files/files-project-option";
import { ListSearchField } from "@/components/workspace/shared/toolbar/list-search-field/list-search-field";
import type { CrmFilesDictionary } from "@/i18n/dictionaries/workspace/crm";
import styles from "./files-toolbar.module.css";

type FilesToolbarProps = {
  content: CrmFilesDictionary;
  filter: CustomerFilesFilter;
  /** Undefined hides the project filter, e.g. inside a project. */
  projects?: readonly FilesProjectOption[];
  /** Offers "customer-wide" only when that scope is readable. */
  showCustomerWide: boolean;
  onFilterChangeAction: (next: Omit<CustomerFilesFilter, "search">) => void;
  onResetAction: () => void;
  onSearchChangeAction: (value: string) => void;
};

function readProject(value: string): string | null | undefined {
  if (value === "") return undefined;
  return value === CUSTOMER_WIDE_FILES_FILTER ? null : value;
}

export function FilesToolbar({
  content,
  filter,
  projects,
  showCustomerWide,
  onFilterChangeAction,
  onResetAction,
  onSearchChangeAction,
}: FilesToolbarProps) {
  const current = {
    projectId: filter.projectId,
    assetKind: filter.assetKind,
    origin: filter.origin,
  };
  const filtered =
    filter.search.trim() !== "" ||
    (projects !== undefined && filter.projectId !== undefined) ||
    filter.assetKind !== undefined ||
    filter.origin !== undefined;

  return (
    <div
      aria-label={content.toolbar.label}
      className={styles.toolbar}
      role="search"
    >
      <div className={styles.search}>
        <ListSearchField
          currentValue={filter.search}
          label={content.toolbar.search}
          onCommitAction={(value) => onSearchChangeAction(value ?? "")}
          placeholder={content.toolbar.searchPlaceholder}
        />
      </div>
      {projects && (projects.length > 0 || showCustomerWide) ? (
        <label className={styles.filter}>
          <span className={styles.filterLabel}>{content.toolbar.project}</span>
          <select
            onChange={(event) =>
              onFilterChangeAction({
                ...current,
                projectId: readProject(event.target.value),
              })
            }
            value={
              filter.projectId === null
                ? CUSTOMER_WIDE_FILES_FILTER
                : (filter.projectId ?? "")
            }
          >
            <option value="">{content.toolbar.projectAll}</option>
            {showCustomerWide ? (
              <option value={CUSTOMER_WIDE_FILES_FILTER}>
                {content.toolbar.customerWide}
              </option>
            ) : null}
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <label className={styles.filter}>
        <span className={styles.filterLabel}>{content.toolbar.kind}</span>
        <select
          onChange={(event) =>
            onFilterChangeAction({
              ...current,
              assetKind: ASSET_KIND_VALUES.find(
                (value) => value === event.target.value,
              ),
            })
          }
          value={filter.assetKind ?? ""}
        >
          <option value="">{content.toolbar.kindAll}</option>
          {ASSET_KIND_VALUES.map((kind) => (
            <option key={kind} value={kind}>
              {content.kinds[kind]}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.filter}>
        <span className={styles.filterLabel}>{content.toolbar.origin}</span>
        <select
          onChange={(event) =>
            onFilterChangeAction({
              ...current,
              origin: FILE_ORIGIN_VALUES.find(
                (value) => value === event.target.value,
              ),
            })
          }
          value={filter.origin ?? ""}
        >
          <option value="">{content.toolbar.originAll}</option>
          {FILE_ORIGIN_VALUES.map((origin) => (
            <option key={origin} value={origin}>
              {content.origins[origin]}
            </option>
          ))}
        </select>
      </label>
      {filtered ? (
        <button className={styles.reset} onClick={onResetAction} type="button">
          <FontAwesomeIcon aria-hidden="true" icon={faXmark} />
          {content.toolbar.reset}
        </button>
      ) : null}
    </div>
  );
}
