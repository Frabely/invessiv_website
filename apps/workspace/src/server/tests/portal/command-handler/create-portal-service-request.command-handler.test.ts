import { beforeEach, describe, expect, it, vi } from "vitest";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import { LineItemProjectMode } from "@invessiv/common/constants/crm/line-item-project-modes";
import { ServiceRequestProjectWish } from "@invessiv/common/constants/crm/service-request-project-wishes";
import { PortalServiceRequestErrorCode as E } from "@invessiv/common/constants/portal/portal-service-request-error-codes";
import type { CreatePortalServiceRequestDto } from "@invessiv/common/contracts/portal/create-portal-service-request.dto";
import { createPortalActor } from "@/server/portal/auth/portal-actor";
import { createPortalServiceRequest } from "@/server/portal/command-handler/create-portal-service-request.command-handler";

const mocks = vi.hoisted(() => ({
  database: vi.fn(),
  selectableProjects: vi.fn(),
  openExtraRoundProjectIds: vi.fn(),
  insert: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@invessiv/db/core", () => ({
  getDrizzleDatabaseClient: mocks.database,
}));
vi.mock(
  "@/server/portal/services/service-requests/portal-service-request-service",
  async (importOriginal) => {
    const original =
      await importOriginal<
        typeof import("@/server/portal/services/service-requests/portal-service-request-service")
      >();
    return {
      portalServiceRequestService: {
        ...original.portalServiceRequestService,
        selectableProjects: mocks.selectableProjects,
        openExtraRoundProjectIds: mocks.openExtraRoundProjectIds,
      },
    };
  },
);

const PROJECT_ID = "11111111-1111-4111-8111-111111111111";
const ACTOR = createPortalActor({
  userId: "user-1",
  membershipId: "membership-1",
  customerId: "customer-1",
  personId: "person-1",
  firstName: null,
  permissions: new Set([
    Permission.PortalAccess,
    Permission.PortalServicesRequest,
  ]),
  projectPermissions: new Map(),
});
const INPUT: CreatePortalServiceRequestDto = {
  idempotencyKey: "22222222-2222-4222-8222-222222222222",
  lineItemTemplateId: "33333333-3333-4333-8333-333333333333",
  title: null,
  note: "",
  requestedMinutes: null,
  projectWish: ServiceRequestProjectWish.Existing,
  projectId: PROJECT_ID,
};

beforeEach(() => {
  vi.resetAllMocks();
  // Customer lock, replay lookup, open-request count, and the released catalog entry.
  const reads: unknown[][] = [
    [{ id: ACTOR.customerId }],
    [],
    [{ total: 0 }],
    [
      {
        id: INPUT.lineItemTemplateId,
        title: "Extra feedback round",
        kind: LineItemKind.FeedbackRound,
        projectMode: LineItemProjectMode.ExistingProject,
      },
    ],
  ];
  const tx = {
    insert: mocks.insert,
    select: vi.fn(() => {
      const rows = reads.shift();
      if (!rows) throw new Error("Unexpected database read");
      const query = {
        from: vi.fn(),
        where: vi.fn(),
        limit: vi.fn(),
        for: vi.fn(),
        then: (resolve: (value: unknown[]) => unknown) =>
          Promise.resolve(rows).then(resolve),
      };
      query.from.mockReturnValue(query);
      query.where.mockReturnValue(query);
      query.limit.mockReturnValue(query);
      query.for.mockReturnValue(query);
      return query;
    }),
  };
  mocks.database.mockReturnValue({
    transaction: (operation: (transaction: typeof tx) => unknown) =>
      operation(tx),
  });
  mocks.selectableProjects.mockResolvedValue([]);
  mocks.openExtraRoundProjectIds.mockResolvedValue(new Set([PROJECT_ID]));
});

describe("createPortalServiceRequest project confidentiality", () => {
  it("does not reveal an open round request on a project the contact cannot select", async () => {
    expect(await createPortalServiceRequest(ACTOR, INPUT)).toEqual({
      ok: false,
      code: E.Validation,
    });
    expect(mocks.openExtraRoundProjectIds).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("still explains an open duplicate on an authorized eligible project", async () => {
    const reader = createPortalActor({
      ...ACTOR,
      permissions: new Set([
        ...ACTOR.permissions,
        Permission.PortalProjectsRead,
      ]),
    });
    mocks.selectableProjects.mockResolvedValue([
      { id: PROJECT_ID, title: "Shop" },
    ]);
    expect(await createPortalServiceRequest(reader, INPUT)).toEqual({
      ok: false,
      code: E.DuplicateOpen,
    });
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});
