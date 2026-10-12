import { describe, expect, it } from "vitest";
import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import { LineItemProjectMode } from "@invessiv/common/constants/crm/line-item-project-modes";
import { ServiceRequestProjectWish } from "@invessiv/common/constants/crm/service-request-project-wishes";
import { ServiceRequestStatus } from "@invessiv/common/constants/crm/service-request-statuses";
import type { ServiceRequestRow } from "@invessiv/common/contracts/crm/rows/service-request-row";
import { portalServiceRequestMappingService as mapping } from "@/server/portal/services/service-requests/portal-service-request-mapping-service";
import type {
  PortalSelectableProjectsByKind,
  PortalServiceCatalogRow,
} from "@/server/portal/services/service-requests/portal-service-request-types";

const WEBSITE = { id: "project-a", title: "Website" };
const SHOP = { id: "project-b", title: "Shop" };
const SELECTABLE: PortalSelectableProjectsByKind = {
  [LineItemKind.Standard]: [WEBSITE, SHOP],
  [LineItemKind.Hours]: [WEBSITE, SHOP],
  [LineItemKind.FeedbackRound]: [WEBSITE],
};
const FORBIDDEN_KEYS = [
  "priceCents",
  "pricingMode",
  "recurringInterval",
  "version",
  "membershipId",
  "decidedByMemberId",
  "lineItemTemplateId",
  "projectLineItemId",
  "customerId",
];

function catalogRow(
  overrides: Partial<PortalServiceCatalogRow> = {},
): PortalServiceCatalogRow {
  return {
    id: "service-1",
    title: "Additional page",
    portal_description: "One more page in your layout.",
    kind: LineItemKind.Standard,
    project_mode: LineItemProjectMode.ExistingProject,
    ...overrides,
  };
}

function requestRow(
  overrides: Partial<ServiceRequestRow> = {},
): ServiceRequestRow {
  return {
    id: "request-1",
    customer_id: "customer-1",
    line_item_template_id: "service-1",
    kind: LineItemKind.Standard,
    title: "Additional page",
    note: "",
    requested_minutes: null,
    project_wish: ServiceRequestProjectWish.Existing,
    requested_project_id: "project-a",
    requested_by_membership_id: "membership-1",
    status: ServiceRequestStatus.Requested,
    decline_reason: null,
    offered_at: null,
    offered_price_cents: null,
    offered_minutes: null,
    decided_at: null,
    decided_by_member_id: null,
    project_id: null,
    project_line_item_id: null,
    idempotency_key: "key-1",
    version: 3,
    created_at: new Date("2026-10-11T08:00:00.000Z"),
    updated_at: new Date("2026-10-11T09:00:00.000Z"),
    ...overrides,
  };
}

describe("portalServiceRequestMappingService.toServiceDto", () => {
  it("maps the customer text and the projects of the service's kind", () => {
    expect(
      mapping.toServiceDto(
        catalogRow({ kind: LineItemKind.FeedbackRound }),
        SELECTABLE,
      ),
    ).toEqual({
      id: "service-1",
      title: "Additional page",
      description: "One more page in your layout.",
      kind: LineItemKind.FeedbackRound,
      projectMode: LineItemProjectMode.ExistingProject,
      projectIds: ["project-a"],
    });
  });

  it("reads NULL in the newer columns as a standard service on an existing project", () => {
    expect(
      mapping.toServiceDto(
        catalogRow({
          kind: null,
          project_mode: null,
          portal_description: null,
        }),
        SELECTABLE,
      ),
    ).toMatchObject({
      description: "",
      kind: LineItemKind.Standard,
      projectMode: LineItemProjectMode.ExistingProject,
      projectIds: ["project-a", "project-b"],
    });
  });

  it("names no project for a service that starts its own", () => {
    expect(
      mapping.toServiceDto(
        catalogRow({ project_mode: LineItemProjectMode.NewProject }),
        SELECTABLE,
      ).projectIds,
    ).toEqual([]);
  });
});

describe("portalServiceRequestMappingService.toRequestDto", () => {
  const view = {
    projectTitles: new Map([[WEBSITE.id, WEBSITE.title]]),
    canRequest: true,
  };

  it("maps every camelCase field and keeps nullable fields null", () => {
    expect(mapping.toRequestDto(requestRow(), view)).toEqual({
      id: "request-1",
      title: "Additional page",
      note: "",
      kind: LineItemKind.Standard,
      requestedMinutes: null,
      projectWish: ServiceRequestProjectWish.Existing,
      projectTitle: "Website",
      status: ServiceRequestStatus.Requested,
      declineReason: null,
      createdAt: "2026-10-11T08:00:00.000Z",
      canWithdraw: true,
    });
  });

  it("prefers the project the request ended up in and hides one the portal does not show", () => {
    expect(
      mapping.toRequestDto(
        requestRow({
          status: ServiceRequestStatus.Accepted,
          project_id: "project-hidden",
        }),
        view,
      ).projectTitle,
    ).toBeNull();
    expect(
      mapping.toRequestDto(
        requestRow({
          project_wish: ServiceRequestProjectWish.Undecided,
          requested_project_id: null,
          status: ServiceRequestStatus.Accepted,
          project_id: "project-a",
        }),
        view,
      ).projectTitle,
    ).toBe("Website");
  });

  it("allows withdrawing until the request is decided and only with the request right", () => {
    for (const status of [
      ServiceRequestStatus.Requested,
      ServiceRequestStatus.Offered,
    ])
      expect(
        mapping.toRequestDto(requestRow({ status }), view).canWithdraw,
      ).toBe(true);
    for (const status of [
      ServiceRequestStatus.Accepted,
      ServiceRequestStatus.Declined,
      ServiceRequestStatus.Withdrawn,
    ])
      expect(
        mapping.toRequestDto(requestRow({ status }), view).canWithdraw,
      ).toBe(false);
    expect(
      mapping.toRequestDto(requestRow(), { ...view, canRequest: false })
        .canWithdraw,
    ).toBe(false);
  });

  it("shows the reason of a declined request only", () => {
    expect(
      mapping.toRequestDto(
        requestRow({
          status: ServiceRequestStatus.Declined,
          decline_reason: "Not this year",
        }),
        view,
      ).declineReason,
    ).toBe("Not this year");
    expect(
      mapping.toRequestDto(requestRow({ decline_reason: "stale" }), view)
        .declineReason,
    ).toBeNull();
  });
});

describe("portalServiceRequestMappingService.toServicesDto", () => {
  it("offers a feedback round only while a project can take one", () => {
    const round = catalogRow({
      id: "service-round",
      kind: LineItemKind.FeedbackRound,
    });
    const source = {
      catalogRows: [catalogRow(), round],
      requestRows: [],
      canRequest: true,
    };

    expect(
      mapping
        .toServicesDto({ ...source, selectableProjects: SELECTABLE })
        .services.map((service) => service.id),
    ).toEqual(["service-1", "service-round"]);
    expect(
      mapping
        .toServicesDto({
          ...source,
          selectableProjects: {
            ...SELECTABLE,
            [LineItemKind.FeedbackRound]: [],
          },
        })
        .services.map((service) => service.id),
    ).toEqual(["service-1"]);
  });

  it("returns empty lists for a company without catalog and requests", () => {
    expect(
      mapping.toServicesDto({
        catalogRows: [],
        requestRows: [],
        selectableProjects: {
          [LineItemKind.Standard]: [],
          [LineItemKind.Hours]: [],
          [LineItemKind.FeedbackRound]: [],
        },
        canRequest: false,
      }),
    ).toEqual({ services: [], projects: [], requests: [], canRequest: false });
  });

  it("never serialises a price, a version or an internal reference", () => {
    const serialised = JSON.stringify(
      mapping.toServicesDto({
        catalogRows: [catalogRow()],
        requestRows: [requestRow()],
        selectableProjects: SELECTABLE,
        canRequest: true,
      }),
    );

    for (const key of FORBIDDEN_KEYS)
      expect(serialised).not.toContain(`"${key}"`);
  });
});
