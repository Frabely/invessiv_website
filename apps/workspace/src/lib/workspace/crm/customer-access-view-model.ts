import "server-only";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { can } from "@invessiv/common/patterns/auth/can";
import { listCustomerAccessScopes } from "@/server/workspace/access/query-handler/list-customer-access-scopes.query-handler";
import { listAccessCustomerProjects } from "@/server/workspace/access/query-handler/list-access-customer-projects.query-handler";
import { listRoleAssignmentOptions } from "@/server/workspace/access/query-handler/list-role-assignment-options.query-handler";
import { listWorkspaceMembers } from "@/server/workspace/access/query-handler/list-workspace-members.query-handler";
import { responsibilityAccessService } from "@/server/workspace/shared/services/responsibility-access-service";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";
import type { CockpitProjectDto } from "@/common/contracts/crm/cockpit-project.dto";

export async function buildCustomerAccessViewModel(options: {
  actor: WorkspaceActor;
  customerId: string;
  cockpitProjects: readonly CockpitProjectDto[] | null;
}) {
  const { actor, customerId, cockpitProjects } = options;
  const customerAccessData = can(actor, Permission.MembersManage)
    ? await Promise.all([
        listCustomerAccessScopes(customerId),
        listAccessCustomerProjects(customerId),
        listWorkspaceMembers(),
        listRoleAssignmentOptions(),
        responsibilityAccessService.evaluate({
          customerId,
          projectIds: cockpitProjects?.map((project) => project.id),
        }),
      ]).then(([scopes, projects, members, roles, responsibilityAccess]) => ({
        scopes,
        projects,
        members,
        roles,
        responsibilityAccess,
      }))
    : null;
  const isWorkspaceOwner = Boolean(
    customerAccessData?.members.some(
      (member) => member.id === actor.workspaceMemberId && member.isOwner,
    ),
  );

  const entityId = "customer:" + customerId;
  return {
    data: customerAccessData,
    isWorkspaceOwner,
    customerOwnerMemberId:
      customerAccessData?.responsibilityAccess.targets.find(
        (target) => target.entityId === entityId,
      )?.ownerMemberId,
    customerOwnerHasAccess: customerAccessData
      ? !customerAccessData.responsibilityAccess.inaccessibleEntityIds.has(
          entityId,
        )
      : undefined,
    projectOwnerHasAccess:
      customerAccessData && cockpitProjects
        ? Object.fromEntries(
            cockpitProjects.map((project) => [
              project.id,
              !customerAccessData.responsibilityAccess.inaccessibleEntityIds.has(
                "project:" + project.id,
              ),
            ]),
          )
        : undefined,
  };
}
