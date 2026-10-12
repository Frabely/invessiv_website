import { describe, expect, it } from "vitest";
import {
  ServiceRequestStatus,
  SERVICE_REQUEST_STATUS_VALUES,
} from "./service-request-statuses";
describe("ServiceRequestStatus", () => {
  it("defines the catalog without duplicates", () => {
    expect(ServiceRequestStatus).toEqual({
      Requested: "requested",
      Offered: "offered",
      Accepted: "accepted",
      Declined: "declined",
      Withdrawn: "withdrawn",
    });
    expect(SERVICE_REQUEST_STATUS_VALUES).toEqual(
      Object.values(ServiceRequestStatus),
    );
    expect(new Set(SERVICE_REQUEST_STATUS_VALUES).size).toBe(
      SERVICE_REQUEST_STATUS_VALUES.length,
    );
  });
});
