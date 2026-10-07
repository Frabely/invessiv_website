import type { CredentialDto } from "@invessiv/common/contracts/credentials/credential.dto";
import type { CredentialsProjectOption } from "@/common/contracts/crm/credentials/credentials-project-option";

type CredentialGroup = {
  /** Null is the customer-wide group. */
  projectId: string | null;
  credentials: CredentialDto[];
};

/**
 * Groups the list by scope and keeps the server's order inside each group. Without a filter the
 * customer-wide group leads; with a project filter that project leads and stays even when empty,
 * so the section can say that nothing is stored for it yet.
 */
export function groupCredentials(
  credentials: readonly CredentialDto[],
  projects: readonly CredentialsProjectOption[],
  filter: string | null | undefined,
): CredentialGroup[] {
  const of = (projectId: string | null): CredentialGroup => ({
    projectId,
    credentials: credentials.filter((entry) => entry.projectId === projectId),
  });
  const customerWide = of(null);
  const projectGroups = projects
    .map((project) => of(project.id))
    .filter(
      (group) => group.credentials.length > 0 || group.projectId === filter,
    );
  const ordered =
    typeof filter === "string"
      ? [...projectGroups, customerWide]
      : [customerWide, ...projectGroups];
  return ordered.filter(
    (group) => group.credentials.length > 0 || group.projectId === filter,
  );
}
