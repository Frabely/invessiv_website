import { beforeEach, describe, expect, it, vi } from "vitest";

import { Permission } from "@invessiv/common/constants/auth/permissions";
import type { CockpitProjectDto } from "@/common/contracts/crm/cockpit-project.dto";
import { buildFilesViewModel } from "@/lib/workspace/crm/files-view-model";
import { workspaceActorWith } from "@/server/tests/support/workspace-auth-fixtures";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({ listWorkspaceMembers: vi.fn() }));

vi.mock(
  "@/server/workspace/access/query-handler/list-workspace-members.query-handler",
  () => ({ listWorkspaceMembers: mocks.listWorkspaceMembers }),
);

const CUSTOMER_ID = "11111111-1111-4111-8111-111111111111";
const PROJECT_A = "33333333-3333-4333-8333-333333333333";
const PROJECT_B = "44444444-4444-4444-8444-444444444444";

const projects = [
  { id: PROJECT_A, title: "A", project: null },
  { id: PROJECT_B, title: "B", project: null },
] as unknown as CockpitProjectDto[];

function projectActor(
  grants: Record<string, Permission[]>,
): ReturnType<typeof workspaceActorWith> {
  return {
    ...workspaceActorWith([]),
    customerPermissions: new Map(),
    projectPermissions: new Map(
      Object.entries(grants).map(([projectId, permissions]) => [
        projectId,
        { customerId: CUSTOMER_ID, permissions: new Set(permissions) },
      ]),
    ),
  };
}

describe("buildFilesViewModel", () => {
  beforeEach(() => {
    mocks.listWorkspaceMembers.mockReset();
    mocks.listWorkspaceMembers.mockResolvedValue([
      { id: "m1", displayName: "Ada", active: true, primaryEmail: "a@x.test" },
    ]);
  });

  it("returns null without any readable scope", async () => {
    expect(
      await buildFilesViewModel({
        actor: workspaceActorWith([Permission.FilesWrite]),
        customerId: CUSTOMER_ID,
        projects,
      }),
    ).toBeNull();
    expect(mocks.listWorkspaceMembers).not.toHaveBeenCalled();
  });

  it("grants every scope for a global role", async () => {
    const result = await buildFilesViewModel({
      actor: workspaceActorWith([
        Permission.FilesRead,
        Permission.FilesWrite,
        Permission.FilesDelete,
      ]),
      customerId: CUSTOMER_ID,
      projects,
    });
    const all = { customerWide: true, projectIds: [PROJECT_A, PROJECT_B] };
    expect(result).toEqual({
      projects: [
        { id: PROJECT_A, title: "A" },
        { id: PROJECT_B, title: "B" },
      ],
      read: all,
      write: all,
      remove: all,
      members: [],
    });
  });

  it("never opens customer-wide entries or foreign projects through a project grant", async () => {
    const result = await buildFilesViewModel({
      actor: projectActor({
        [PROJECT_A]: [Permission.FilesRead, Permission.FilesWrite],
      }),
      customerId: CUSTOMER_ID,
      projects,
    });
    expect(result).toMatchObject({
      projects: [{ id: PROJECT_A, title: "A" }],
      read: { customerWide: false, projectIds: [PROJECT_A] },
      write: { customerWide: false, projectIds: [PROJECT_A] },
      remove: { customerWide: false, projectIds: [] },
    });
  });

  it("hands out member names only with members.read, without e-mail addresses", async () => {
    const result = await buildFilesViewModel({
      actor: workspaceActorWith([Permission.FilesRead, Permission.MembersRead]),
      customerId: CUSTOMER_ID,
      projects,
    });
    expect(result?.members).toEqual([{ id: "m1", displayName: "Ada" }]);
  });
});
