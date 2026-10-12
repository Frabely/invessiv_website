import { describe, expect, it } from "vitest";
import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import { LineItemProjectMode } from "@invessiv/common/constants/crm/line-item-project-modes";
import { ServiceRequestProjectWish as Mode } from "@invessiv/common/constants/crm/service-request-project-wishes";
import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import { SERVICE_REQUEST_ERROR_CODE_VALUES } from "@invessiv/common/constants/crm/errors/service-request-error-codes";
import {
  serviceRequestFixture,
  serviceRequestTemplateFixture,
  serviceRequestsViewModelFixture,
} from "@/server/tests/support/service-request-fixtures";
import { getCrmServiceRequestsDictionary } from "@/i18n/dictionaries/workspace/crm";
import {
  canChooseServiceRequestProject,
  canChooseServiceRequestTemplate,
  createServiceRequestAcceptForm,
  applyServiceRequestTemplate,
  validateServiceRequestAcceptForm,
  toAcceptServiceRequest,
} from "./service-request-accept-form";
import { serviceRequestErrorText } from "./service-request-error-text";

describe("service request acceptance form", () => {
  it("prefills catalog fields and the wished project and carries the current version", () => {
    const request = serviceRequestFixture({ version: 4 });
    const vm = serviceRequestsViewModelFixture();
    const values = createServiceRequestAcceptForm(request, vm, "de");
    expect(values).toMatchObject({
      title: "Catalog service",
      description: "Internal scope",
      priceInput: "125",
      projectMode: Mode.Existing,
      projectId: request.requestedProjectId,
    });
    expect(validateServiceRequestAcceptForm(values, request)).toBe(true);
    expect(toAcceptServiceRequest(values, request, vm)).toMatchObject({
      version: 4,
      project: { mode: Mode.Existing, projectId: request.requestedProjectId },
      template: {
        mode: Mode.Existing,
        lineItemTemplateId: request.lineItemTemplateId,
      },
      lineItem: { priceCents: 12500, quantityMinutes: null },
    });
  });
  it("offers the choice between existing and new only where both ways exist", () => {
    const vm = serviceRequestsViewModelFixture();
    const free = serviceRequestFixture({ lineItemTemplateId: null });
    expect(canChooseServiceRequestProject(free, vm)).toBe(true);
    expect(
      canChooseServiceRequestProject(free, { ...vm, canCreateProject: false }),
    ).toBe(false);
    expect(
      canChooseServiceRequestProject(
        serviceRequestFixture({ kind: LineItemKind.Hours }),
        vm,
      ),
    ).toBe(false);
    expect(canChooseServiceRequestTemplate(free, vm)).toBe(true);
    expect(canChooseServiceRequestTemplate(serviceRequestFixture(), vm)).toBe(
      false,
    );
    expect(
      canChooseServiceRequestTemplate(free, {
        ...vm,
        canCreateTemplate: false,
      }),
    ).toBe(false);
  });
  it("honors new-project preference from the customer or the template only with permission", () => {
    const request = serviceRequestFixture({ projectWish: Mode.New });
    const vm = serviceRequestsViewModelFixture();
    expect(createServiceRequestAcceptForm(request, vm, "en").projectMode).toBe(
      Mode.New,
    );
    expect(
      createServiceRequestAcceptForm(
        request,
        { ...vm, canCreateProject: false },
        "en",
      ).projectMode,
    ).toBe(Mode.Existing);
    expect(
      createServiceRequestAcceptForm(
        serviceRequestFixture(),
        {
          ...vm,
          templates: [
            serviceRequestTemplateFixture({
              projectMode: LineItemProjectMode.NewProject,
            }),
          ],
        },
        "en",
      ).projectMode,
    ).toBe(Mode.New);
  });
  it("requires a price for free text and creates an unreleased standard template with the default two-round plan", () => {
    const request = serviceRequestFixture({
      lineItemTemplateId: null,
      projectWish: Mode.New,
    });
    const vm = serviceRequestsViewModelFixture();
    const values = createServiceRequestAcceptForm(request, vm, "en");
    expect(values).toMatchObject({
      title: request.title,
      description: request.note,
      priceInput: "",
      templateMode: Mode.New,
      projectMode: Mode.New,
    });
    expect(validateServiceRequestAcceptForm(values, request)).toBe(false);
    values.priceInput = "250.00";
    expect(validateServiceRequestAcceptForm(values, request)).toBe(true);
    const input = toAcceptServiceRequest(values, request, vm);
    expect(input.template).toMatchObject({
      mode: Mode.New,
      template: {
        kind: LineItemKind.Standard,
        portalRequestable: false,
        portalDescription: "",
      },
    });
    expect(input.project).toMatchObject({
      mode: Mode.New,
      project: {
        title: request.title,
        feedbackRoundPositions: vm.defaultPlan.feedbackRoundPositions,
      },
    });
    expect(vm.defaultPlan.feedbackRoundPositions).toHaveLength(2);
  });
  it("never offers new projects for hours and preserves a corrected quantity and free-stock choice", () => {
    const template = serviceRequestTemplateFixture({
      kind: LineItemKind.Hours,
      pricingMode: ServicePricingMode.Rate,
    });
    const request = serviceRequestFixture({
      kind: LineItemKind.Hours,
      requestedMinutes: 300,
      projectWish: Mode.New,
    });
    const vm = serviceRequestsViewModelFixture({ templates: [template] });
    const values = createServiceRequestAcceptForm(request, vm, "en");
    expect(values).toMatchObject({
      quantityInput: "5:00",
      projectMode: Mode.Existing,
    });
    values.quantityInput = "4:00";
    values.allocateHoursToProject = false;
    expect(toAcceptServiceRequest(values, request, vm).lineItem).toMatchObject({
      quantityMinutes: 240,
      allocateHoursToProject: false,
    });
    values.quantityInput = "4:01";
    expect(validateServiceRequestAcceptForm(values, request)).toBe(false);
  });
  it("requires active replacement selection and preserves project and quantity while selecting a template", () => {
    const vm = serviceRequestsViewModelFixture({ templates: [] });
    const request = serviceRequestFixture();
    const values = createServiceRequestAcceptForm(request, vm, "en");
    expect(values.templateId).toBe("");
    expect(validateServiceRequestAcceptForm(values, request)).toBe(false);
    const selected = applyServiceRequestTemplate(
      values,
      serviceRequestTemplateFixture({ title: "Replacement" }),
      "en",
    );
    expect(selected).toMatchObject({
      title: "Replacement",
      projectId: values.projectId,
      quantityInput: values.quantityInput,
    });
    expect(validateServiceRequestAcceptForm(selected, request)).toBe(true);
  });
  it("explains every backend error in both languages", () => {
    for (const locale of ["de", "en"] as const)
      for (const code of SERVICE_REQUEST_ERROR_CODE_VALUES)
        expect(
          serviceRequestErrorText(
            code,
            getCrmServiceRequestsDictionary(locale),
          ).trim().length,
        ).toBeGreaterThan(0);
  });
});
