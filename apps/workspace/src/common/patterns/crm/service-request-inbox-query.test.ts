import { describe, expect, it } from "vitest";
import {
  ServiceRequestInboxFilter as F,
  ServiceRequestInboxQueryParam as Q,
  ServiceRequestDialogAction as A,
} from "@/common/constants/crm/service-request-inbox-query-params";
import {
  buildServiceRequestInboxHref,
  readServiceRequestInboxFilter,
  buildServiceRequestActionHref,
} from "./service-request-inbox-query";
import {
  buildCustomerCockpitHref,
  buildCustomerCockpitCloseHref,
  readCockpitServiceRequestId,
} from "./customer-dialog-query";
import {
  crmServiceRequestAcceptEndpoint,
  crmServiceRequestStatusEndpoint,
} from "./crm-api-endpoints";

describe("service request URL state", () => {
  it("keeps query names explicit and defaults unsupported filters to open", () => {
    expect(Q).toEqual({
      Filter: "filter",
      Request: "serviceRequest",
      Action: "serviceRequestAction",
    });
    expect(F).toEqual({ Open: "open", All: "all" });
    expect(A).toEqual({ Accept: "accept", Decline: "decline" });
    for (const filter of [undefined, "bogus", ["all"]])
      expect(readServiceRequestInboxFilter({ filter })).toBe(F.Open);
    expect(readServiceRequestInboxFilter({ filter: "all" })).toBe(F.All);
    expect(
      buildServiceRequestInboxHref("/en/crm/service-requests", F.All),
    ).toBe("/en/crm/service-requests?filter=all");
  });
  it("preserves list state and clears customer-bound request state on cockpit close or customer change", () => {
    const href = buildCustomerCockpitHref("/de/crm", "c", "q=test", {
      serviceRequestId: "r",
    });
    expect(href).toBe("/de/crm?q=test&cockpit=c&serviceRequest=r");
    const action = buildServiceRequestActionHref(
      "/de/crm",
      href.split("?")[1],
      "r",
      A.Decline,
    );
    expect(action).toContain("serviceRequestAction=decline");
    expect(
      buildServiceRequestActionHref("/de/crm", action.split("?")[1], "r", null),
    ).toBe(href);
    expect(buildCustomerCockpitCloseHref("/de/crm", action.split("?")[1])).toBe(
      "/de/crm?q=test",
    );
    expect(
      buildCustomerCockpitHref("/de/crm", "other", action.split("?")[1]),
    ).toBe("/de/crm?q=test&cockpit=other");
    expect(readCockpitServiceRequestId({ serviceRequest: "r" })).toBe("r");
    expect(
      readCockpitServiceRequestId({ serviceRequest: ["r", "foreign"] }),
    ).toBeNull();
  });
  it("encodes request ids in both mutation endpoint paths", () => {
    expect(crmServiceRequestStatusEndpoint("id/other")).toBe(
      "/api/workspace/crm/service-requests/id%2Fother/status",
    );
    expect(crmServiceRequestAcceptEndpoint("id/other")).toBe(
      "/api/workspace/crm/service-requests/id%2Fother/accept",
    );
  });
});
