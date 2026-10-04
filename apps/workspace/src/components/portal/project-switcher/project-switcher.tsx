"use client";

import { useId } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { CustomSelect } from "@invessiv/ui";
import { PortalDashboardQueryParam } from "@/common/constants/portal/portal-dashboard-query-params";
import { buildPortalHref } from "@/common/patterns/portal/build-portal-href";
import { selectPortalCurrentProject } from "@/common/patterns/portal/select-portal-current-project";
import styles from "./project-switcher.module.css";

export type ProjectSwitcherProps = {
  dashboardHref: string;
  label: string;
  projects: readonly { id: string; title: string }[];
};

export function ProjectSwitcher({
  dashboardHref,
  label,
  projects,
}: ProjectSwitcherProps) {
  const pathname = usePathname();
  const search = useSearchParams();
  const id = useId();
  const selected = selectPortalCurrentProject(
    projects,
    search.get(PortalDashboardQueryParam.Project),
  );
  if (!selected || projects.length <= 1) return null;
  return (
    <div className={styles.root}>
      <CustomSelect
        ariaLabel={label}
        id={id}
        onChange={(projectId) => {
          window.location.assign(
            buildPortalHref(
              dashboardHref,
              pathname === dashboardHref ? search.toString() : "",
              { project: projectId, widget: null },
            ),
          );
        }}
        options={projects.map((project) => ({
          value: project.id,
          label: project.title,
        }))}
        value={selected.id}
      />
    </div>
  );
}
