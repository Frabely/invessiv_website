"use client";

import { useId } from "react";
import type { PortalFileProjectOptionDto } from "@invessiv/common/contracts/portal/portal-file-project-option.dto";
import { CustomSelect } from "@invessiv/ui";
import {
  PORTAL_FILE_ORIGIN_FILTER_VALUES,
  type PortalFileOriginFilter,
} from "@/common/constants/portal/portal-file-origin-filter";
import { PortalFilesScope } from "@/common/constants/portal/portal-files-query-params";
import type { PortalFilesDictionary } from "@/i18n/dictionaries/portal";
import styles from "./portal-files-filters.module.css";

export type PortalFilesFiltersProps = {
  content: PortalFilesDictionary;
  originFilter: PortalFileOriginFilter;
  projects: readonly PortalFileProjectOptionDto[];
  /** A project id, or `PortalFilesScope.All` for every project. */
  projectValue: string;
  onOriginChangeAction: (next: PortalFileOriginFilter) => void;
  onProjectChangeAction: (next: string) => void;
};

/** The two filters of the files page: which project, and who added the file. */
export function PortalFilesFilters({
  content,
  originFilter,
  projects,
  projectValue,
  onOriginChangeAction,
  onProjectChangeAction,
}: PortalFilesFiltersProps) {
  const baseId = useId();

  return (
    <div className={styles.filters}>
      {projects.length > 0 ? (
        <div className={styles.filter}>
          <CustomSelect
            ariaLabel={content.scope.label}
            id={`${baseId}-project`}
            onChange={onProjectChangeAction}
            options={[
              ...projects.map((project) => ({
                value: project.id,
                label: project.title,
              })),
              { value: PortalFilesScope.All, label: content.scope.all },
            ]}
            value={projectValue}
          />
        </div>
      ) : null}
      <div className={styles.filter}>
        <CustomSelect
          ariaLabel={content.origin.label}
          id={`${baseId}-origin`}
          onChange={onOriginChangeAction}
          options={PORTAL_FILE_ORIGIN_FILTER_VALUES.map((filter) => ({
            value: filter,
            label: content.origin[filter],
          }))}
          value={originFilter}
        />
      </div>
    </div>
  );
}
