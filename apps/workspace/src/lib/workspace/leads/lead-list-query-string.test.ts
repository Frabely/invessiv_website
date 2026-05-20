import { describe, expect, it } from "vitest";
import { LeadFormDialogMode } from "@invessiv/common/constants/leads/forms/lead-form-dialog-modes";
import { LeadListQueryParam } from "@invessiv/common/constants/leads/list/lead-list-query-params";
import {
  buildLeadCreateHref,
  buildLeadDetailPanelEditHref,
  buildLeadDialogCloseHref,
  buildLeadEditHref,
  buildLeadTableRowEditHref,
  getLeadFormDialogMode,
} from "./lead-list-query-string";

describe("lead list dialog query helpers", () => {
  it("builds a create dialog URL with mode=create", () => {
    const href = buildLeadCreateHref("/de/leads", {
      status: "qualified",
    });
    const url = new URL(href, "https://invessiv.com");

    expect(url.pathname).toBe("/de/leads");
    expect(url.searchParams.get(LeadListQueryParam.Mode)).toBe(
      LeadFormDialogMode.Create,
    );
    expect(url.searchParams.get(LeadListQueryParam.Status)).toBe("qualified");
  });

  it("builds an edit dialog URL with mode=edit and the lead id", () => {
    const href = buildLeadEditHref("/de/leads", "lead-123", {
      selected: "lead-999",
      status: "qualified",
    });
    const url = new URL(href, "https://invessiv.com");

    expect(url.searchParams.get(LeadListQueryParam.Mode)).toBe(
      LeadFormDialogMode.Edit,
    );
    expect(url.searchParams.get(LeadListQueryParam.TargetLeadId)).toBe(
      "lead-123",
    );
    expect(url.searchParams.get(LeadListQueryParam.Selected)).toBe("lead-999");
    expect(url.searchParams.get(LeadListQueryParam.Status)).toBe("qualified");
  });

  it("builds a table-row edit dialog URL from the current query string", () => {
    const href = buildLeadTableRowEditHref("/de/leads", "lead-123", {
      selected: "lead-999",
      status: "qualified",
    });
    const url = new URL(href, "https://invessiv.com");

    expect(url.pathname).toBe("/de/leads");
    expect(url.searchParams.get(LeadListQueryParam.Mode)).toBe(
      LeadFormDialogMode.Edit,
    );
    expect(url.searchParams.get(LeadListQueryParam.TargetLeadId)).toBe(
      "lead-123",
    );
    expect(url.searchParams.get(LeadListQueryParam.Selected)).toBe("lead-999");
    expect(url.searchParams.get(LeadListQueryParam.Status)).toBe("qualified");
  });

  it("builds a detail-panel edit dialog URL from the current query string", () => {
    const href = buildLeadDetailPanelEditHref("/de/leads", "lead-123", {
      selected: "lead-999",
      status: "qualified",
    });
    const url = new URL(href, "https://invessiv.com");

    expect(url.pathname).toBe("/de/leads");
    expect(url.searchParams.get(LeadListQueryParam.Mode)).toBe(
      LeadFormDialogMode.Edit,
    );
    expect(url.searchParams.get(LeadListQueryParam.TargetLeadId)).toBe(
      "lead-123",
    );
    expect(url.searchParams.get(LeadListQueryParam.Selected)).toBe("lead-999");
    expect(url.searchParams.get(LeadListQueryParam.Status)).toBe("qualified");
  });

  it("removes dialog state when closing but keeps the surrounding list state", () => {
    const href = buildLeadDialogCloseHref("/de/leads", {
      edit: "lead-123",
      mode: "edit",
      selected: "lead-999",
      status: "qualified",
    });
    const url = new URL(href, "https://invessiv.com");

    expect(url.searchParams.get(LeadListQueryParam.Mode)).toBeNull();
    expect(url.searchParams.get(LeadListQueryParam.TargetLeadId)).toBeNull();
    expect(url.searchParams.get(LeadListQueryParam.Selected)).toBe("lead-999");
    expect(url.searchParams.get(LeadListQueryParam.Status)).toBe("qualified");
  });

  it("parses the dialog mode from the canonical and legacy query forms", () => {
    expect(getLeadFormDialogMode({ mode: "create" })).toBe(
      LeadFormDialogMode.Create,
    );
    expect(getLeadFormDialogMode({ mode: "edit", edit: "lead-123" })).toBe(
      LeadFormDialogMode.Edit,
    );
    expect(getLeadFormDialogMode({})).toBeUndefined();
  });
});
