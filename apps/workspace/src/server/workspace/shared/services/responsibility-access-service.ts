import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { getDrizzleDatabaseClient } from "@invessiv/db/core";
import { customers, projects } from "@invessiv/db/record-configuration";
import { canOn, type PermissionTarget } from "@/common/patterns/auth/can-on";
import { resolveWorkspaceActorsByMemberIds } from "@/server/workspace/auth/query-handler/resolve-workspace-actor.query-handler";

type OwnedTarget = {
  entityId: string;
  ownerMemberId: string;
  target: PermissionTarget;
};

type ResponsibilityAccessEvaluationInput = {
  customerId?: string;
  memberIds?: readonly string[];
  projectIds?: readonly string[];
};

type OwnershipAdapter = {
  requiredPermission: Permission;
  load: (input: ResponsibilityAccessEvaluationInput) => Promise<OwnedTarget[]>;
};

const db = getDrizzleDatabaseClient();

const OWNERSHIP_ADAPTERS = [
  {
    requiredPermission: Permission.CustomersRead,
    async load({ customerId, memberIds }) {
      const rows = await db
        .select({ id: customers.id, ownerMemberId: customers.owner_member_id })
        .from(customers)
        .where(
          and(
            customerId ? eq(customers.id, customerId) : undefined,
            memberIds
              ? inArray(customers.owner_member_id, memberIds)
              : undefined,
          ),
        );
      return rows.map((row) => ({
        entityId: `customer:${row.id}`,
        ownerMemberId: row.ownerMemberId,
        target: { customerId: row.id },
      }));
    },
  },
  {
    requiredPermission: Permission.ProjectsRead,
    async load({ customerId, memberIds, projectIds }) {
      const rows = await db
        .select({
          customerId: projects.customer_id,
          id: projects.id,
          ownerMemberId: projects.owner_member_id,
        })
        .from(projects)
        .where(
          and(
            customerId ? eq(projects.customer_id, customerId) : undefined,
            projectIds ? inArray(projects.id, projectIds) : undefined,
            memberIds
              ? inArray(projects.owner_member_id, memberIds)
              : undefined,
          ),
        );
      return rows.map((row) => ({
        entityId: `project:${row.id}`,
        ownerMemberId: row.ownerMemberId,
        target: { customerId: row.customerId, projectId: row.id },
      }));
    },
  },
] satisfies readonly OwnershipAdapter[];

async function evaluate(input: ResponsibilityAccessEvaluationInput = {}) {
  const groups = await Promise.all(
    OWNERSHIP_ADAPTERS.map(async (adapter) => ({
      adapter,
      targets: await adapter.load(input),
    })),
  );
  const targets = groups.flatMap(({ adapter, targets: adapterTargets }) =>
    adapterTargets.map((target) => ({ ...target, adapter })),
  );
  const memberIds = [...new Set(targets.map((target) => target.ownerMemberId))];
  const resolutions = await resolveWorkspaceActorsByMemberIds(memberIds);
  const inaccessibleEntityIds = new Set<string>();
  const countByMemberId: Record<string, number> = {};

  for (const target of targets) {
    const resolution = resolutions.get(target.ownerMemberId);
    const hasAccess =
      resolution?.ok === true &&
      canOn(resolution.actor, target.adapter.requiredPermission, target.target);
    if (hasAccess) continue;
    inaccessibleEntityIds.add(target.entityId);
    countByMemberId[target.ownerMemberId] =
      (countByMemberId[target.ownerMemberId] ?? 0) + 1;
  }

  return { countByMemberId, inaccessibleEntityIds, targets };
}

export const responsibilityAccessService = { evaluate } as const;
