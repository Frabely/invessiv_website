import { describe, expect, it } from "vitest";

import {
  PORTAL_PROJECT_PAGE_VALUES,
  PortalProjectPage,
} from "@/common/constants/portal/portal-project-pages";

describe("PortalProjectPage", () => {
  it("contains the exact page slugs without duplicates", () => {
    expect(PORTAL_PROJECT_PAGE_VALUES).toEqual(["feedback"]);
    expect([...PORTAL_PROJECT_PAGE_VALUES]).toEqual(
      Object.values(PortalProjectPage),
    );
  });
});
