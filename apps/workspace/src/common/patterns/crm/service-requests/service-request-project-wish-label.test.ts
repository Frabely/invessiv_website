import { describe, expect, it } from "vitest";
import { ServiceRequestProjectWish } from "@invessiv/common/constants/crm/service-request-project-wishes";
import { getCrmServiceRequestsDictionary } from "@/i18n/dictionaries/workspace/crm";
import { serviceRequestFixture } from "@/server/tests/support/service-request-fixtures";
import { describeServiceRequestProjectWish } from "./service-request-project-wish-label";

const content = getCrmServiceRequestsDictionary("en");

describe("describeServiceRequestProjectWish", () => {
  it("names the wished project when the actor may read it", () => {
    expect(
      describeServiceRequestProjectWish(
        serviceRequestFixture({ requestedProjectTitle: "Website" }),
        content,
      ),
    ).toBe("Website");
  });

  it("says the project is not visible instead of leaking or inventing a title", () => {
    expect(
      describeServiceRequestProjectWish(
        serviceRequestFixture({ requestedProjectTitle: null }),
        content,
      ),
    ).toBe(content.details.projectUnavailable);
  });

  it("falls back to the kind of wish when no existing project was wished", () => {
    for (const projectWish of [
      ServiceRequestProjectWish.New,
      ServiceRequestProjectWish.Undecided,
    ]) {
      expect(
        describeServiceRequestProjectWish(
          serviceRequestFixture({
            projectWish,
            requestedProjectId: null,
            requestedProjectTitle: null,
          }),
          content,
        ),
      ).toBe(content.wish[projectWish]);
    }
  });
});
