import { requestableService } from "@/test/fixtures/portal/portal-service-request-fixtures";
import { describe, expect, it } from "vitest";
import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import { LineItemProjectMode } from "@invessiv/common/constants/crm/line-item-project-modes";
import { ServiceRequestProjectWish as Wish } from "@invessiv/common/constants/crm/service-request-project-wishes";
import type { PortalRequestableServiceDto } from "@invessiv/common/contracts/portal/portal-requestable-service.dto";
import { PortalServiceRequestFormField as Field } from "@/common/constants/portal/portal-service-request-form-fields";
import { portalServiceRequestForm as form } from "./portal-service-request-form";

const PROJECTS = [
  { id: "project-a", title: "Website" },
  { id: "project-b", title: "Shop" },
];
const KEY = "11111111-1111-4111-8111-111111111111";

function service(
  overrides: Partial<PortalRequestableServiceDto> = {},
): PortalRequestableServiceDto {
  return requestableService({
    projectIds: ["project-a", "project-b"],
    ...overrides,
  });
}

describe("portalServiceRequestForm.projectQuestion", () => {
  it("asks for the project when a catalog entry fits several", () => {
    const question = form.projectQuestion(service(), PROJECTS);

    expect(question.asks).toBe(true);
    expect(question.wishes).toEqual([Wish.Existing]);
    expect(question.projects).toEqual(PROJECTS);
  });

  it("does not ask with exactly one project and answers it up front", () => {
    const question = form.projectQuestion(
      service({ projectIds: ["project-b"] }),
      PROJECTS,
    );

    expect(question.asks).toBe(false);
    expect(form.initialValues(question, null)).toMatchObject({
      projectWish: Wish.Existing,
      projectId: "project-b",
    });
  });

  it("drops the question without a selectable project and leaves the wish undecided", () => {
    const question = form.projectQuestion(
      service({ projectIds: [] }),
      PROJECTS,
    );

    expect(question.asks).toBe(false);
    expect(form.initialValues(question, "project-a")).toMatchObject({
      projectWish: Wish.Undecided,
      projectId: null,
    });
  });

  it("states a new project for a service that starts one", () => {
    const question = form.projectQuestion(
      service({ projectMode: LineItemProjectMode.NewProject, projectIds: [] }),
      PROJECTS,
    );

    expect(question.asks).toBe(false);
    expect(form.initialValues(question, "project-a").projectWish).toBe(
      Wish.New,
    );
  });

  it("offers every project, a new venture and undecided for free text", () => {
    const question = form.projectQuestion(null, PROJECTS);

    expect(question.asks).toBe(true);
    expect(question.wishes).toEqual([Wish.Existing, Wish.New, Wish.Undecided]);
    expect(form.initialValues(question, null)).toMatchObject({
      projectWish: null,
      projectId: null,
    });
  });

  it("preselects the dashboard's project only where the service allows it", () => {
    expect(
      form.initialValues(form.projectQuestion(service(), PROJECTS), "project-b")
        .projectId,
    ).toBe("project-b");
    expect(
      form.initialValues(
        form.projectQuestion(service(), PROJECTS),
        "project-foreign",
      ).projectId,
    ).toBeNull();
  });

  it("lets hours go without a project even when one is selectable", () => {
    const question = form.projectQuestion(
      service({ kind: LineItemKind.Hours, projectIds: ["project-a"] }),
      PROJECTS,
    );

    expect(question.asks).toBe(true);
    expect(question.wishes).toEqual([Wish.Existing, Wish.Undecided]);
  });
});

describe("portalServiceRequestForm.toRequestedMinutes", () => {
  it("accepts whole hours inside the bounds only", () => {
    expect(form.toRequestedMinutes("5")).toBe(300);
    expect(form.toRequestedMinutes(" 100 ")).toBe(6000);
    expect(form.toRequestedMinutes("")).toBeNull();
    expect(form.toRequestedMinutes("0")).toBeNull();
    expect(form.toRequestedMinutes("101")).toBeNull();
    expect(form.toRequestedMinutes("2.5")).toBeNull();
    expect(form.toRequestedMinutes("-3")).toBeNull();
  });
});

describe("portalServiceRequestForm.invalidFields", () => {
  it("keeps an hours request without an amount from sending", () => {
    const hours = service({ kind: LineItemKind.Hours });
    const question = form.projectQuestion(hours, PROJECTS);
    const values = {
      ...form.initialValues(question, "project-a"),
      hours: "",
    };

    expect(form.invalidFields(values, hours, question)).toEqual([Field.Hours]);
    expect(
      form.invalidFields({ ...values, hours: "5" }, hours, question),
    ).toEqual([]);
  });

  it("requires title, project answer and description for free text", () => {
    const question = form.projectQuestion(null, PROJECTS);
    const values = form.initialValues(question, null);

    expect(form.invalidFields(values, null, question)).toEqual([
      Field.Title,
      Field.Project,
      Field.Note,
    ]);
    expect(
      form.invalidFields(
        {
          ...values,
          title: "Second landing page",
          note: "For the summer offer",
          projectWish: Wish.New,
        },
        null,
        question,
      ),
    ).toEqual([]);
  });

  it("rejects a project the service is not offered for", () => {
    const question = form.projectQuestion(service(), PROJECTS);

    expect(
      form.invalidFields(
        {
          title: "",
          note: "",
          hours: "",
          projectWish: Wish.Existing,
          projectId: "project-foreign",
        },
        service(),
        question,
      ),
    ).toEqual([Field.Project]);
  });
});

describe("portalServiceRequestForm.toRequest", () => {
  it("names the catalog entry and never a title, kind, company or price", () => {
    const request = form.toRequest(
      {
        title: "ignored",
        note: "  Please by June  ",
        hours: "",
        projectWish: Wish.Existing,
        projectId: "project-a",
      },
      service(),
      KEY,
    );

    expect(request).toEqual({
      idempotencyKey: KEY,
      lineItemTemplateId: "service-1",
      title: null,
      note: "Please by June",
      requestedMinutes: null,
      projectWish: Wish.Existing,
      projectId: "project-a",
    });
    expect(Object.keys(request).join(" ")).not.toMatch(
      /price|pricing|interval|kind|customer/i,
    );
  });

  it("sends the amount in minutes for hours and drops a stale project", () => {
    expect(
      form.toRequest(
        {
          title: "",
          note: "",
          hours: "5",
          projectWish: Wish.Undecided,
          projectId: "project-a",
        },
        service({ kind: LineItemKind.Hours }),
        KEY,
      ),
    ).toMatchObject({
      requestedMinutes: 300,
      projectWish: Wish.Undecided,
      projectId: null,
    });
  });

  it("sends the contact's own title for free text", () => {
    expect(
      form.toRequest(
        {
          title: " Second landing page ",
          note: "For the summer offer",
          hours: "7",
          projectWish: Wish.New,
          projectId: null,
        },
        null,
        KEY,
      ),
    ).toEqual({
      idempotencyKey: KEY,
      lineItemTemplateId: null,
      title: "Second landing page",
      note: "For the summer offer",
      requestedMinutes: null,
      projectWish: Wish.New,
      projectId: null,
    });
  });
});
