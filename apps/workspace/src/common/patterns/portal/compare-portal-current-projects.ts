import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";

function rank(status: ProjectStatus): number {
  if (status === ProjectStatus.Active) return 0;
  if (status === ProjectStatus.Paused) return 1;
  if (status === ProjectStatus.Planned) return 2;
  return 3;
}

/** Preserve newest-first database order within each current-status group. */
export function comparePortalCurrentProjects<
  T extends { status: ProjectStatus },
>(a: T, b: T): number {
  return rank(a.status) - rank(b.status);
}
