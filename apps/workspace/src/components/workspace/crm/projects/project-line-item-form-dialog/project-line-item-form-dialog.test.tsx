// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import { LineItemProjectMode } from "@invessiv/common/constants/crm/line-item-project-modes";
import { LineItemTemplateStatus } from "@invessiv/common/constants/crm/line-item-template-statuses";
import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import { ProjectLineItemErrorCode } from "@invessiv/common/constants/crm/errors/project-line-item-error-codes";
import type { LineItemTemplateDto } from "@invessiv/common/contracts/crm/line-item-template.dto";
import { LineItemAssignmentBlocker } from "@/common/constants/crm/line-item-assignment-blockers";
import type { LineItemAssignmentBlockers } from "@/common/contracts/crm/line-item-assignment-blockers";
import { getCrmProjectLineItemsDictionary } from "@/i18n/dictionaries/workspace/crm";
import { ProjectLineItemFormDialog } from "./project-line-item-form-dialog";

const api = vi.hoisted(() => ({
  createProjectLineItem: vi.fn(),
  updateProjectLineItem: vi.fn(),
}));
vi.mock("@/client/crm/project-line-items-api-service", () => ({
  projectLineItemsApiService: api,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const content = getCrmProjectLineItemsDictionary("en");
const template: LineItemTemplateDto = {
  id: "9c8f1a10-1b1a-4a10-8e10-00000000f007",
  title: "Purchased hours",
  description: "Development hours",
  priceCents: 10000,
  pricingMode: ServicePricingMode.Rate,
  recurringInterval: null,
  kind: LineItemKind.Hours,
  projectMode: LineItemProjectMode.ExistingProject,
  portalRequestable: false,
  portalDescription: "",
  status: LineItemTemplateStatus.Active,
  version: 3,
  createdAt: "2026-10-11T12:00:00.000Z",
  updatedAt: "2026-10-11T12:00:00.000Z",
};

function renderDialog(
  blockers: LineItemAssignmentBlockers = { hours: null, feedbackRound: null },
) {
  return render(
    <ProjectLineItemFormDialog
      blockers={blockers}
      catalogHref={null}
      content={content}
      locale="en"
      onCloseAction={vi.fn()}
      projectId="11111111-1111-4111-8111-111111111111"
      projectLineItem={null}
      templates={[template]}
    />,
  );
}

function selectHours() {
  fireEvent.click(
    screen.getByRole("button", {
      name: new RegExp(content.form.fields.sourceLineItemTemplateId),
    }),
  );
  fireEvent.click(screen.getByRole("option", { name: /Purchased hours/ }));
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ProjectLineItemFormDialog", () => {
  it("does not send purchased hours without a quantity", () => {
    renderDialog();
    selectHours();
    fireEvent.click(
      screen.getByRole("button", { name: content.form.buttons.submitCreate }),
    );
    expect(api.createProjectLineItem).not.toHaveBeenCalled();
    expect(
      screen.getByText(content.form.quantity.required),
    ).toBeInTheDocument();
  });

  it("permits free-stock sales on a closed project and retains the replay key after a failed response", async () => {
    api.createProjectLineItem.mockResolvedValue({
      ok: false,
      code: ProjectLineItemErrorCode.Internal,
    });
    renderDialog({
      hours: LineItemAssignmentBlocker.ProjectClosed,
      feedbackRound: null,
    });
    selectHours();
    const submit = screen.getByRole("button", {
      name: content.form.buttons.submitCreate,
    });
    expect(submit).toBeDisabled();
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: content.form.fields.allocateHoursToProject,
      }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: content.form.quantity.increaseHours }),
    );
    expect(submit).not.toBeDisabled();
    fireEvent.click(submit);
    await waitFor(() =>
      expect(
        screen.getByText(content.form.errors.INTERNAL),
      ).toBeInTheDocument(),
    );
    expect(api.createProjectLineItem.mock.calls[0][1]).toMatchObject({
      quantityMinutes: 60,
      allocateHoursToProject: false,
      sourceLineItemTemplateVersion: 3,
      idempotencyKey: expect.any(String),
    });
    fireEvent.click(submit);
    await waitFor(() =>
      expect(api.createProjectLineItem).toHaveBeenCalledTimes(2),
    );
    expect(api.createProjectLineItem.mock.calls[1][1].idempotencyKey).toBe(
      api.createProjectLineItem.mock.calls[0][1].idempotencyKey,
    );
  });

  it("explains and disables an hours option without permission", () => {
    renderDialog({
      hours: LineItemAssignmentBlocker.MissingHoursPermission,
      feedbackRound: null,
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: new RegExp(content.form.fields.sourceLineItemTemplateId),
      }),
    );
    const option = screen.getByRole("option", { name: /Purchased hours/ });
    expect(option).toHaveAttribute("aria-disabled", "true");
    expect(option).toHaveTextContent(
      content.form.blockers.missing_hours_permission,
    );
    fireEvent.click(option);
    expect(
      screen.queryByRole("checkbox", {
        name: content.form.fields.allocateHoursToProject,
      }),
    ).toBeNull();
  });
});
