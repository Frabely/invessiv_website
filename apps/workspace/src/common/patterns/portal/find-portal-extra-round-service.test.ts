import {
  portalServices,
  requestableService,
} from "@/test/fixtures/portal/portal-service-request-fixtures";
import { describe, expect, it } from "vitest";
import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import type { PortalRequestableServiceDto } from "@invessiv/common/contracts/portal/portal-requestable-service.dto";
import type { PortalServicesDto } from "@invessiv/common/contracts/portal/portal-services.dto";
import { findPortalExtraRoundService } from "./find-portal-extra-round-service";

function service(
  overrides: Partial<PortalRequestableServiceDto>,
): PortalRequestableServiceDto {
  return requestableService({
    title: "Further feedback round",
    description: "One more round",
    kind: LineItemKind.FeedbackRound,
    ...overrides,
  });
}

function services(
  overrides: Partial<PortalServicesDto> = {},
): PortalServicesDto {
  return portalServices({
    services: [service({})],
    projects: [{ id: "project-1", title: "Website" }],
    ...overrides,
  });
}

describe("findPortalExtraRoundService", () => {
  it("finds the round service offered for the project", () => {
    expect(findPortalExtraRoundService(services(), "project-1")?.id).toBe(
      "service-1",
    );
  });

  it("finds nothing for another project or another kind of service", () => {
    expect(findPortalExtraRoundService(services(), "project-2")).toBeNull();
    expect(
      findPortalExtraRoundService(
        services({ services: [service({ kind: LineItemKind.Hours })] }),
        "project-1",
      ),
    ).toBeNull();
  });

  it("finds nothing without the request right or without services at all", () => {
    expect(
      findPortalExtraRoundService(services({ canRequest: false }), "project-1"),
    ).toBeNull();
    expect(findPortalExtraRoundService(null, "project-1")).toBeNull();
  });
});
