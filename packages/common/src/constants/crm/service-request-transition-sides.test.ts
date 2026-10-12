import { describe, expect, it } from "vitest";
import {
  ServiceRequestTransitionSide,
  SERVICE_REQUEST_TRANSITION_SIDE_VALUES,
} from "./service-request-transition-sides";
describe("ServiceRequestTransitionSide", () => {
  it("defines the catalog without duplicates", () => {
    expect(ServiceRequestTransitionSide).toEqual({
      Internal: "internal",
      Customer: "customer",
    });
    expect(SERVICE_REQUEST_TRANSITION_SIDE_VALUES).toEqual(
      Object.values(ServiceRequestTransitionSide),
    );
    expect(new Set(SERVICE_REQUEST_TRANSITION_SIDE_VALUES).size).toBe(
      SERVICE_REQUEST_TRANSITION_SIDE_VALUES.length,
    );
  });
});
