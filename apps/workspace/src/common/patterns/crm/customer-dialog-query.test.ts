import { describe, expect, it } from "vitest";

import {
  buildCustomerCreateHref,
  buildCustomerCockpitCloseHref,
  buildCustomerCockpitHref,
  buildCustomerDialogCloseHref,
  buildCustomerEditHref,
  readCustomerDialogRequest,
  readCustomerCockpitId,
  readCockpitFeedbackRoundId,
  readCockpitProjectId,
} from "@/common/patterns/crm/customer-dialog-query";

const CUSTOMER_ID = "0b8a5f7e-3f2d-4c1b-9a8e-7d6c5b4a3f21";

describe("readCustomerDialogRequest", () => {
  it("opens the create dialog", () => {
    expect(readCustomerDialogRequest({ mode: "create" })).toEqual({
      mode: "create",
    });
  });

  it("opens the edit dialog only together with an id", () => {
    expect(
      readCustomerDialogRequest({ mode: "edit", edit: CUSTOMER_ID }),
    ).toEqual({ mode: "edit", customerId: CUSTOMER_ID });
    expect(readCustomerDialogRequest({ mode: "edit" })).toBeNull();
    expect(readCustomerDialogRequest({ mode: "edit", edit: " " })).toBeNull();
  });

  it("ignores unknown modes and repeated params", () => {
    expect(readCustomerDialogRequest({ mode: "delete" })).toBeNull();
    expect(readCustomerDialogRequest({ mode: ["create", "edit"] })).toBeNull();
    expect(readCustomerDialogRequest({})).toBeNull();
  });
});

describe("customer dialog hrefs", () => {
  it("builds create and edit hrefs on the given base path", () => {
    expect(buildCustomerCreateHref("/de/crm")).toBe("/de/crm?mode=create");
    expect(buildCustomerEditHref("/de/crm", CUSTOMER_ID)).toBe(
      `/de/crm?mode=edit&edit=${CUSTOMER_ID}`,
    );
  });

  it("preserves list state and removes dialog state", () => {
    const query = "page=2&sort=name_asc&mode=edit&edit=old";
    expect(buildCustomerCreateHref("/de/crm", query)).toBe(
      "/de/crm?page=2&sort=name_asc&mode=create",
    );
    expect(buildCustomerEditHref("/de/crm", CUSTOMER_ID, query)).toBe(
      `/de/crm?page=2&sort=name_asc&mode=edit&edit=${CUSTOMER_ID}`,
    );
    expect(buildCustomerDialogCloseHref("/de/crm", query)).toBe(
      "/de/crm?page=2&sort=name_asc",
    );
  });
});

describe("customer cockpit hrefs", () => {
  it("preserves an open edit dialog and removes only the cockpit id on close", () => {
    const query = `page=2&mode=edit&edit=${CUSTOMER_ID}`;
    expect(buildCustomerCockpitHref("/de/crm", CUSTOMER_ID, query)).toBe(
      `/de/crm?${query}&cockpit=${CUSTOMER_ID}`,
    );
    expect(
      buildCustomerCockpitCloseHref(
        "/de/crm",
        `${query}&cockpit=${CUSTOMER_ID}`,
      ),
    ).toBe(`/de/crm?${query}`);
    expect(readCustomerCockpitId({ cockpit: CUSTOMER_ID })).toBe(CUSTOMER_ID);
  });

  it("opens a project tab and a feedback round inside the cockpit", () => {
    const href = buildCustomerCockpitHref("/de/crm", CUSTOMER_ID, "page=2", {
      projectId: "p-1",
      feedbackRoundId: "r-1",
    });
    expect(href).toBe(
      `/de/crm?page=2&cockpit=${CUSTOMER_ID}&project=p-1&feedbackRound=r-1`,
    );
    const params = Object.fromEntries(new URL(href, "http://x").searchParams);
    expect(readCockpitProjectId(params)).toBe("p-1");
    expect(readCockpitFeedbackRoundId(params)).toBe("r-1");
  });

  it("drops a round without project and the selection of another cockpit", () => {
    expect(
      buildCustomerCockpitHref("/de/crm", CUSTOMER_ID, "", {
        feedbackRoundId: "r-1",
      }),
    ).toBe(`/de/crm?cockpit=${CUSTOMER_ID}`);
    expect(
      buildCustomerCockpitHref(
        "/de/crm",
        CUSTOMER_ID,
        "cockpit=other&project=p-9&feedbackRound=r-9",
      ),
    ).toBe(`/de/crm?cockpit=${CUSTOMER_ID}`);
  });

  it("closes project tab and round together with the cockpit", () => {
    expect(
      buildCustomerCockpitCloseHref(
        "/de/crm",
        `page=2&cockpit=${CUSTOMER_ID}&project=p-1&feedbackRound=r-1`,
      ),
    ).toBe("/de/crm?page=2");
  });
});
