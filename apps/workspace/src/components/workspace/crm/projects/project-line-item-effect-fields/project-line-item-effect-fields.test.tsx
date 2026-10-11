// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import { formatMessage } from "@invessiv/common/patterns/i18n/format-message";
import { LineItemAssignmentBlocker } from "@/common/constants/crm/line-item-assignment-blockers";
import { getCrmProjectLineItemsDictionary } from "@/i18n/dictionaries/workspace/crm";
import {
  ProjectLineItemEffectFields,
  type ProjectLineItemEffectFieldsProps,
} from "./project-line-item-effect-fields";

const content = getCrmProjectLineItemsDictionary("de");

function renderFields(overrides: Partial<ProjectLineItemEffectFieldsProps>) {
  return render(
    <ProjectLineItemEffectFields
      allocateHoursToProject
      onAllocateChangeAction={vi.fn()}
      blocker={null}
      content={content}
      kind={LineItemKind.Hours}
      locale="de"
      onQuantityChangeAction={vi.fn()}
      quantityInput=""
      quantityMinutes={null}
      rateCents={10000}
      storedQuantityMinutes={undefined}
      {...overrides}
    />,
  );
}

describe("ProjectLineItemEffectFields", () => {
  afterEach(cleanup);

  it("renders nothing for a standard service", () => {
    const { container } = renderFields({ kind: LineItemKind.Standard });

    expect(container).toBeEmptyDOMElement();
  });

  it("asks for the quantity of purchased hours and says what happens to it", () => {
    renderFields({});

    expect(
      screen.getByRole("group", { name: content.form.fields.quantity }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(content.form.effects.hoursPending),
    ).toBeInTheDocument();
  });

  it("names the credited time and its value once both are known", () => {
    renderFields({ quantityInput: "5:00", quantityMinutes: 300 });

    expect(
      screen.getByText(
        formatMessage(content.form.effects.hours, {
          duration: "5:00",
          amount: "500,00 €",
        }),
      ),
    ).toBeInTheDocument();
  });

  it("says that unallocated hours stay free for any project", () => {
    renderFields({
      allocateHoursToProject: false,
      quantityInput: "5:00",
      quantityMinutes: 300,
    });

    expect(
      screen.getByRole("checkbox", {
        name: content.form.fields.allocateHoursToProject,
      }),
    ).not.toBeChecked();
    expect(
      screen.getByText(
        formatMessage(content.form.effects.hoursFree, {
          duration: "5:00",
          amount: "500,00 €",
        }),
      ),
    ).toBeInTheDocument();
  });

  it("explains the blocker as text instead of offering the quantity", () => {
    renderFields({
      blocker: LineItemAssignmentBlocker.MissingHoursPermission,
    });

    expect(screen.getByRole("alert")).toHaveTextContent(
      content.form.blockers.missing_hours_permission,
    );
    expect(
      screen.queryByRole("group", { name: content.form.fields.quantity }),
    ).toBeNull();
  });

  it("shows stored hours as fixed while editing", () => {
    renderFields({ storedQuantityMinutes: 315 });

    expect(
      screen.getByText(
        formatMessage(content.form.effects.hoursFixed, { duration: "5:15" }),
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("group", { name: content.form.fields.quantity }),
    ).toBeNull();
  });

  it("says what a further feedback round does", () => {
    renderFields({ kind: LineItemKind.FeedbackRound });

    expect(
      screen.getByText(content.form.effects.feedbackRound),
    ).toBeInTheDocument();
  });
  it("keeps the free-stock choice usable when project allocation is blocked", () => {
    const onAllocateChangeAction = vi.fn();
    renderFields({
      blocker: LineItemAssignmentBlocker.ProjectClosed,
      onAllocateChangeAction,
    });
    expect(screen.getByRole("alert")).toHaveTextContent(
      content.form.blockers.project_closed,
    );
    expect(
      screen.getByRole("group", { name: content.form.fields.quantity }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: content.form.fields.allocateHoursToProject,
      }),
    );
    expect(onAllocateChangeAction).toHaveBeenCalledWith(false);
  });
});
