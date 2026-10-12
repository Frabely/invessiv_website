import { describe, expect, it } from "vitest";
import {
  ServiceRequestProjectWish,
  SERVICE_REQUEST_PROJECT_WISH_VALUES,
} from "./service-request-project-wishes";
describe("ServiceRequestProjectWish", () => {
  it("defines the catalog without duplicates", () => {
    expect(ServiceRequestProjectWish).toEqual({
      Existing: "existing",
      New: "new",
      Undecided: "undecided",
    });
    expect(SERVICE_REQUEST_PROJECT_WISH_VALUES).toEqual(
      Object.values(ServiceRequestProjectWish),
    );
    expect(new Set(SERVICE_REQUEST_PROJECT_WISH_VALUES).size).toBe(
      SERVICE_REQUEST_PROJECT_WISH_VALUES.length,
    );
  });
});
