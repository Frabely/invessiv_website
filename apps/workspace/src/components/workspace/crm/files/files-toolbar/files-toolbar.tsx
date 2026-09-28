"use client";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useId } from "react";
import { ASSET_KIND_VALUES } from "@invessiv/common/constants/files/asset-kind";
import { FILE_ORIGIN_VALUES } from "@invessiv/common/constants/files/file-origin";
import { CUSTOMER_WIDE_FILES_FILTER } from "@/common/constants/crm/files/customer-files-query-params";
import { ButtonControl, CustomSelect } from "@invessiv/ui";
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
  const projectSelectId = useId();
  const kindSelectId = useId();
  const originSelectId = useId();
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
        <div className={styles.filter}>
          <span className={styles.filterLabel}>{content.toolbar.project}</span>
          <CustomSelect
            ariaLabel={content.toolbar.project}
            id={projectSelectId}
            onChange={(value) =>
              onFilterChangeAction({
                ...current,
                projectId: readProject(value),
              })
            }
            options={[
              { value: "", label: content.toolbar.projectAll },
              ...(showCustomerWide
                ? [
                    {
                      value: CUSTOMER_WIDE_FILES_FILTER,
                      label: content.toolbar.customerWide,
                    },
                  ]
                : []),
              ...projects.map((project) => ({
                value: project.id,
                label: project.title,
              })),
            ]}
            value={
              filter.projectId === null
                ? CUSTOMER_WIDE_FILES_FILTER
                : (filter.projectId ?? "")
            }
          />
        </div>
      ) : null}
      <div className={styles.filter}>
        <span className={styles.filterLabel}>{content.toolbar.kind}</span>
        <CustomSelect
          ariaLabel={content.toolbar.kind}
          id={kindSelectId}
          onChange={(value) =>
            onFilterChangeAction({
              ...current,
              assetKind: ASSET_KIND_VALUES.find((kind) => kind === value),
            })
          }
          options={[
            { value: "", label: content.toolbar.kindAll },
            ...ASSET_KIND_VALUES.map((kind) => ({
              value: kind,
              label: content.kinds[kind],
            })),
          ]}
          value={filter.assetKind ?? ""}
        />
      </div>
      <div className={styles.filter}>
        <span className={styles.filterLabel}>{content.toolbar.origin}</span>
        <CustomSelect
          ariaLabel={content.toolbar.origin}
          id={originSelectId}
          onChange={(value) =>
            onFilterChangeAction({
              ...current,
              origin: FILE_ORIGIN_VALUES.find((origin) => origin === value),
            })
          }
          options={[
            { value: "", label: content.toolbar.originAll },
            ...FILE_ORIGIN_VALUES.map((origin) => ({
              value: origin,
              label: content.origins[origin],
            })),
          ]}
          value={filter.origin ?? ""}
        />
      </div>
      {filtered ? (
        <ButtonControl
          className={styles.reset}
          onClick={onResetAction}
          type="button"
          variant="ghost"
        >
          <FontAwesomeIcon aria-hidden="true" icon={faXmark} />
          {content.toolbar.reset}
        </ButtonControl>
      ) : null}
    </div>
  );
}
