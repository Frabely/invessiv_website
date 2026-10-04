/**
 * The project the portal shows. An unknown or foreign id falls back to the first current project
 * without an error, so a guessed id confirms nothing.
 */
export function selectPortalCurrentProject<Project extends { id: string }>(
  currentProjects: readonly Project[],
  requestedProjectId: string | null | undefined,
): Project | null {
  return (
    currentProjects.find((project) => project.id === requestedProjectId) ??
    currentProjects[0] ??
    null
  );
}
