import { describe, expectTypeOf, it } from "vitest";
import type { CreatePortalServiceRequestDto } from "./create-portal-service-request.dto";
import type { PortalRequestableServiceDto } from "./portal-requestable-service.dto";
import type { PortalServiceRequestDto } from "./portal-service-request.dto";
import type { PortalServicesDto } from "./portal-services.dto";

describe("portal service contracts", () => {
  it("keeps every price field out of the catalog", () => {
    expectTypeOf<PortalRequestableServiceDto>().not.toHaveProperty(
      "priceCents",
    );
    expectTypeOf<PortalRequestableServiceDto>().not.toHaveProperty(
      "pricingMode",
    );
    expectTypeOf<PortalRequestableServiceDto>().not.toHaveProperty(
      "recurringInterval",
    );
    expectTypeOf<PortalRequestableServiceDto>().not.toHaveProperty("version");
    expectTypeOf<PortalRequestableServiceDto>().not.toHaveProperty("status");
    expectTypeOf<
      PortalServicesDto["services"][number]
    >().toEqualTypeOf<PortalRequestableServiceDto>();
  });

  it("keeps people, versions and internal references out of a request", () => {
    expectTypeOf<PortalServiceRequestDto>().not.toHaveProperty("version");
    expectTypeOf<PortalServiceRequestDto>().not.toHaveProperty("customerId");
    expectTypeOf<PortalServiceRequestDto>().not.toHaveProperty(
      "requestedByMembershipId",
    );
    expectTypeOf<PortalServiceRequestDto>().not.toHaveProperty(
      "decidedByMemberId",
    );
    expectTypeOf<PortalServiceRequestDto>().not.toHaveProperty(
      "lineItemTemplateId",
    );
    expectTypeOf<PortalServiceRequestDto>().not.toHaveProperty(
      "projectLineItemId",
    );
    expectTypeOf<PortalServiceRequestDto>().not.toHaveProperty("priceCents");
  });

  it("lets a contact send neither a company nor a price", () => {
    expectTypeOf<CreatePortalServiceRequestDto>().not.toHaveProperty(
      "customerId",
    );
    expectTypeOf<CreatePortalServiceRequestDto>().not.toHaveProperty(
      "priceCents",
    );
    expectTypeOf<CreatePortalServiceRequestDto>().not.toHaveProperty("kind");
  });
});
