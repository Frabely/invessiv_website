import { beforeEach, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import type { WorkspaceActor } from "@/common/contracts/auth/workspace-actor";

const mocks = vi.hoisted(() => ({
  getDrizzleDatabaseClient: vi.fn(),
  resolveWorkspaceActorsByMemberIds: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@invessiv/db/core", () => ({
  getDrizzleDatabaseClient: mocks.getDrizzleDatabaseClient,
}));
vi.mock(
  "@/server/workspace/auth/query-handler/resolve-workspace-actor.query-handler",
  () => ({
    resolveWorkspaceActorsByMemberIds: mocks.resolveWorkspaceActorsByMemberIds,
  }),
);

function drizzleChain(value: unknown) {
  const proxy: Record<string | symbol, unknown> = new Proxy(
    {},
    {
      get(_, property: string | symbol) {
        if (property === "then") {
          return (resolve: (result: unknown) => void) =>
            Promise.resolve(value).then(resolve);
        }
        return vi.fn().mockReturnValue(proxy);
      },
    },
  );
  return proxy;
}

function actor(
  memberId: string,
  permissions: Permission[] = [],
  projectPermissions: WorkspaceActor["projectPermissions"] = new Map(),
): WorkspaceActor {
  return {
    userId: `user-${memberId}`,
    workspaceMemberId: memberId,
    permissions: new Set(permissions),
    customerPermissions: new Map(),
    projectPermissions,
  };
}

describe("responsibilityAccessService", () => {
  beforeEach(() => {
    vi.resetModules();
    Object.values(mocks).forEach((mock) => mock.mockReset());
    const results = [
      [
        { id: "customer-1", ownerMemberId: "member-1" },
        { id: "customer-2", ownerMemberId: "member-2" },
      ],
      [
        {
          id: "project-1",
          customerId: "customer-1",
          ownerMemberId: "member-1",
        },
        {
          id: "project-2",
          customerId: "customer-2",
          ownerMemberId: "member-2",
        },
      ],
      [
        {
          id: "task-1",
          customerId: "customer-1",
          ownerMemberId: "member-1",
          projectId: "project-1",
        },
        {
          id: "task-2",
          customerId: "customer-2",
          ownerMemberId: "member-2",
          projectId: "project-2",
        },
      ],
    ];
    let queryIndex = 0;
    mocks.getDrizzleDatabaseClient.mockReturnValue({
      select: vi.fn(() => drizzleChain(results[queryIndex++] ?? [])),
    });
    mocks.resolveWorkspaceActorsByMemberIds.mockImplementation(
      async (memberIds: string[]) =>
        new Map(
          memberIds.map((memberId) => [
            memberId,
            {
              ok: true,
              actor:
                memberId === "member-1"
                  ? actor(memberId, [Permission.CustomersRead])
                  : actor(
                      memberId,
                      [],
                      new Map([
                        [
                          "project-2",
                          {
                            customerId: "customer-2",
                            permissions: new Set([Permission.ProjectsRead]),
                          },
                        ],
                      ]),
                    ),
            },
          ]),
        ),
    );
  });

  it("counts every owned record whose owner lacks the required effective access", async () => {
    const { responsibilityAccessService } =
      await import("@/server/workspace/shared/services/responsibility-access-service");

    const result = await responsibilityAccessService.evaluate();

    expect(result.countByMemberId).toEqual({
      "member-1": 2,
      "member-2": 2,
    });
    expect([...result.inaccessibleEntityIds]).toEqual([
      "customer:customer-2",
      "project:project-1",
      "task:task-1",
      "task:task-2",
    ]);
  });

  it("resolves every distinct owner in a single batched call instead of one per member", async () => {
    const { responsibilityAccessService } =
      await import("@/server/workspace/shared/services/responsibility-access-service");

    await responsibilityAccessService.evaluate();

    expect(mocks.resolveWorkspaceActorsByMemberIds).toHaveBeenCalledTimes(1);
    expect(mocks.resolveWorkspaceActorsByMemberIds).toHaveBeenCalledWith([
      "member-1",
      "member-2",
    ]);
  });
});
