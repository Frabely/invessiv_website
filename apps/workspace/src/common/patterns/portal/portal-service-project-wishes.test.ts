import { describe, expect, it } from "vitest";
import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import { LineItemProjectMode } from "@invessiv/common/constants/crm/line-item-project-modes";
import { ServiceRequestProjectWish as Wish } from "@invessiv/common/constants/crm/service-request-project-wishes";
import { listPortalServiceProjectWishes } from "./portal-service-project-wishes";

const existingProject = (kind: LineItemKind) => ({
  kind,
  projectMode: LineItemProjectMode.ExistingProject,
});

describe("listPortalServiceProjectWishes", () => {
  it("lets free text name a project, a new venture or nothing yet", () => {
    expect(
      listPortalServiceProjectWishes({
        service: null,
        selectableProjectCount: 2,
      }),
    ).toEqual([Wish.Existing, Wish.New, Wish.Undecided]);
    expect(
      listPortalServiceProjectWishes({
        service: null,
        selectableProjectCount: 0,
      }),
    ).toEqual([Wish.New, Wish.Undecided]);
  });

  it("asks nothing for a service that starts its own project", () => {
    expect(
      listPortalServiceProjectWishes({
        service: {
          kind: LineItemKind.Standard,
          projectMode: LineItemProjectMode.NewProject,
        },
        selectableProjectCount: 3,
      }),
    ).toEqual([Wish.New]);
  });

  it("binds a standard service to a project and falls back to undecided without one", () => {
    expect(
      listPortalServiceProjectWishes({
        service: existingProject(LineItemKind.Standard),
        selectableProjectCount: 1,
      }),
    ).toEqual([Wish.Existing]);
    expect(
      listPortalServiceProjectWishes({
        service: existingProject(LineItemKind.Standard),
        selectableProjectCount: 0,
      }),
    ).toEqual([Wish.Undecided]);
  });

  it("always allows hours without a project", () => {
    expect(
      listPortalServiceProjectWishes({
        service: existingProject(LineItemKind.Hours),
        selectableProjectCount: 2,
      }),
    ).toEqual([Wish.Existing, Wish.Undecided]);
    expect(
      listPortalServiceProjectWishes({
        service: existingProject(LineItemKind.Hours),
        selectableProjectCount: 0,
      }),
    ).toEqual([Wish.Undecided]);
  });

  it("offers a further feedback round only on a project", () => {
    expect(
      listPortalServiceProjectWishes({
        service: existingProject(LineItemKind.FeedbackRound),
        selectableProjectCount: 1,
      }),
    ).toEqual([Wish.Existing]);
    expect(
      listPortalServiceProjectWishes({
        service: existingProject(LineItemKind.FeedbackRound),
        selectableProjectCount: 0,
      }),
    ).toEqual([]);
  });
});
