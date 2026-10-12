import { beforeEach, describe, expect, it, vi } from "vitest";
import { Permission } from "@invessiv/common/constants/auth/permissions";
import { FeedbackRoundStatus } from "@invessiv/common/constants/crm/feedback-round-statuses";
import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import { LineItemProjectMode } from "@invessiv/common/constants/crm/line-item-project-modes";
import { ProjectStatus } from "@invessiv/common/constants/crm/project-statuses";
import { ServiceRequestProjectWish } from "@invessiv/common/constants/crm/service-request-project-wishes";
import { ServiceRequestStatus } from "@invessiv/common/constants/crm/service-request-statuses";
import {
  feedbackRounds,
  lineItemTemplates,
  projects,
  serviceRequests,
} from "@invessiv/db/record-configuration";
import { createPortalActor } from "@/server/portal/auth/portal-actor";
import { getPortalServices } from "@/server/portal/query-handler/get-portal-services.query-handler";

const mocks = vi.hoisted(() => ({ database: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@invessiv/db/core", () => ({
  getDrizzleDatabaseClient: mocks.database,
}));

const reader = createPortalActor({
  userId: "user-1",
  membershipId: "membership-1",
  customerId: "customer-1",
  personId: "person-1",
  firstName: null,
  permissions: new Set([
    Permission.PortalServicesRead,
    Permission.PortalServicesRequest,
  ]),
  projectPermissions: new Map(),
});

/** A recording query executor: building a UNION branch does not count as another executed statement. */
function recordingDatabase(includeFeedback: boolean) {
  const statements: { table: object; columns: Record<string, unknown> }[] = [];
  const candidates = [
    {
      id: "active",
      title: "Active",
      status: ProjectStatus.Active,
      feedback_round_positions: [2],
    },
    {
      id: "waiting",
      title: "Waiting",
      status: ProjectStatus.Active,
      feedback_round_positions: [2],
    },
    {
      id: "approved",
      title: "Approved",
      status: ProjectStatus.Active,
      feedback_round_positions: [2],
    },
    {
      id: "paused",
      title: "Paused",
      status: ProjectStatus.Paused,
      feedback_round_positions: [2],
    },
    {
      id: "completed",
      title: "Completed",
      status: ProjectStatus.Completed,
      feedback_round_positions: [2],
    },
  ];
  const catalog = [
    {
      id: "standard",
      title: "Page",
      portal_description: "A page",
      kind: LineItemKind.Standard,
      project_mode: LineItemProjectMode.ExistingProject,
    },
    {
      id: "hours",
      title: "Hours",
      portal_description: "Support",
      kind: LineItemKind.Hours,
      project_mode: LineItemProjectMode.ExistingProject,
    },
    ...(includeFeedback
      ? [
          {
            id: "round",
            title: "Round",
            portal_description: "Further feedback",
            kind: LineItemKind.FeedbackRound,
            project_mode: LineItemProjectMode.ExistingProject,
          },
        ]
      : []),
  ];
  const requests = [
    {
      id: "request-1",
      title: "Round",
      note: "",
      kind: LineItemKind.FeedbackRound,
      requested_minutes: null,
      project_wish: ServiceRequestProjectWish.Existing,
      requested_project_id: "waiting",
      project_id: null,
      status: ServiceRequestStatus.Offered,
      decline_reason: null,
      created_at: new Date("2026-10-12T08:00:00.000Z"),
    },
  ];
  const db = {
    select: (columns: Record<string, unknown>) => {
      let table: object;
      const query = {
        from: (value: object) => {
          table = value;
          return query;
        },
        where: () => query,
        orderBy: () => query,
        limit: () => query,
        unionAll: () => query,
        then: (resolve: (value: unknown[]) => unknown) => {
          statements.push({ table, columns });
          const rows =
            table === projects
              ? candidates
              : table === serviceRequests
                ? requests
                : table === lineItemTemplates
                  ? catalog
                  : [
                      {
                        projectId: "approved",
                        status: FeedbackRoundStatus.Approved,
                      },
                    ];
          return Promise.resolve(rows).then(resolve);
        },
      };
      return query;
    },
  };
  return { db, statements };
}

describe("getPortalServices query budget", () => {
  beforeEach(() => mocks.database.mockReset());

  it("loads projects once and reuses open requests while preserving feedback eligibility", async () => {
    const recording = recordingDatabase(true);
    mocks.database.mockReturnValue(recording.db);
    const result = await getPortalServices(reader);
    expect(recording.statements).toHaveLength(4);
    expect(
      recording.statements.filter((statement) => statement.table === projects),
    ).toHaveLength(1);
    expect(
      recording.statements.filter(
        (statement) => statement.table === serviceRequests,
      ),
    ).toHaveLength(1);
    expect(
      result?.services.find(
        (service) => service.kind === LineItemKind.FeedbackRound,
      )?.projectIds,
    ).toEqual(["active"]);
    expect(
      result?.services.find((service) => service.kind === LineItemKind.Hours)
        ?.projectIds,
    ).toEqual(["active", "waiting", "approved", "paused", "completed"]);
    expect(result?.requests[0]).toMatchObject({
      projectTitle: "Waiting",
      canWithdraw: false,
    });
    const columns = recording.statements.find(
      (statement) => statement.table === serviceRequests,
    )!.columns;
    expect(columns).not.toHaveProperty("version");
    expect(columns).not.toHaveProperty("requested_by_membership_id");
    expect(columns).not.toHaveProperty("idempotency_key");
  });

  it("skips round-status reads without a feedback-round catalog entry", async () => {
    const recording = recordingDatabase(false);
    mocks.database.mockReturnValue(recording.db);
    await getPortalServices(reader);
    expect(recording.statements).toHaveLength(3);
    expect(
      recording.statements.some(
        (statement) => statement.table === feedbackRounds,
      ),
    ).toBe(false);
  });

  it("does not access the database without the read permission", async () => {
    expect(
      await getPortalServices(
        createPortalActor({ ...reader, permissions: new Set() }),
      ),
    ).toBeNull();
    expect(mocks.database).not.toHaveBeenCalled();
  });
});
