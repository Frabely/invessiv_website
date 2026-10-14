import { describe, expect, it } from "vitest";
import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import { BillingInterval } from "@invessiv/common/constants/crm/billing-intervals";
import { LineItemProjectMode } from "@invessiv/common/constants/crm/line-item-project-modes";
import { ServiceRequestProjectWish as Mode } from "@invessiv/common/constants/crm/service-request-project-wishes";
import { ServiceRequestStatus } from "@invessiv/common/constants/crm/service-request-statuses";
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
  reconcileServiceRequestOffer,
  validateServiceRequestAcceptForm,
  toAcceptServiceRequest,
} from "./service-request-accept-form";
import { serviceRequestErrorText } from "./service-request-error-text";

describe("service request acceptance form", () => {
  it("rebases untouched conditions on an offer received through a version conflict", () => {
    const previous = serviceRequestFixture();
    const vm = serviceRequestsViewModelFixture();
    const current = serviceRequestFixture({
      status: ServiceRequestStatus.Offered,
      version: 2,
      offeredPriceCents: 99000,
      offeredPricingMode: ServicePricingMode.Recurring,
      offeredRecurringInterval: BillingInterval.Monthly,
    });
    const result = reconcileServiceRequestOffer(
      createServiceRequestAcceptForm(previous, vm, "en"),
      previous,
      current,
      vm,
      "en",
    );
    expect(result.requiresConfirmation).toBe(false);
    expect(toAcceptServiceRequest(result.values, current, vm)).toMatchObject({
      version: 2,
      acceptWithoutOffer: false,
      lineItem: {
        priceCents: 99000,
        pricingMode: ServicePricingMode.Recurring,
        recurringInterval: BillingInterval.Monthly,
      },
    });
  });
  it("preserves edited prices but requires acknowledgement of the new offer", () => {
    const previous = serviceRequestFixture();
    const vm = serviceRequestsViewModelFixture();
    const values = {
      ...createServiceRequestAcceptForm(previous, vm, "en"),
      priceInput: "250",
    };
    const current = serviceRequestFixture({
      offeredPriceCents: 99000,
      offeredPricingMode: ServicePricingMode.OneTime,
    });
    const result = reconcileServiceRequestOffer(
      values,
      previous,
      current,
      vm,
      "en",
    );
    expect(result.values.priceInput).toBe("250");
    expect(result.requiresConfirmation).toBe(true);
  });
  it.each([false, true])(
    "reconciles offered hours while preserving edited quantities: %s",
    (edited) => {
      const previous = serviceRequestFixture({
        kind: LineItemKind.Hours,
        requestedMinutes: 300,
      });
      const vm = serviceRequestsViewModelFixture({
        templates: [
          serviceRequestTemplateFixture({
            kind: LineItemKind.Hours,
            pricingMode: ServicePricingMode.Rate,
          }),
        ],
      });
      const values = createServiceRequestAcceptForm(previous, vm, "en");
      if (edited) values.quantityInput = "7:00";
      const current = serviceRequestFixture({
        ...previous,
        offeredPriceCents: 11000,
        offeredPricingMode: ServicePricingMode.Rate,
        offeredMinutes: 600,
      });
      const result = reconcileServiceRequestOffer(
        values,
        previous,
        current,
        vm,
        "en",
      );
      expect(result.values.priceInput).toBe("110");
      expect(result.values.quantityInput).toBe(edited ? "7:00" : "10:00");
      expect(result.requiresConfirmation).toBe(edited);
    },
  );
  it("leaves form values alone when a conflict contains no changed offer", () => {
    const request = serviceRequestFixture();
    const vm = serviceRequestsViewModelFixture();
    const values = {
      ...createServiceRequestAcceptForm(request, vm, "en"),
      priceInput: "250",
    };
    expect(
      reconcileServiceRequestOffer(
        values,
        request,
        { ...request, version: 2 },
        vm,
        "en",
      ),
    ).toEqual({ values, requiresConfirmation: false });
  });
  it.each([null, serviceRequestFixture().lineItemTemplateId])(
    "preserves offered conditions when free text or an archived template needs a replacement: %s",
    (lineItemTemplateId) => {
      const request = serviceRequestFixture({
        lineItemTemplateId,
        status: ServiceRequestStatus.Offered,
        offeredPriceCents: 99000,
        offeredPricingMode: ServicePricingMode.Recurring,
        offeredRecurringInterval: BillingInterval.Monthly,
      });
      const vm = serviceRequestsViewModelFixture({ templates: [] });
      const values = createServiceRequestAcceptForm(request, vm, "de");
      const selected = applyServiceRequestTemplate(
        values,
        serviceRequestTemplateFixture({
          pricingMode: ServicePricingMode.OneTime,
          priceCents: 12500,
        }),
        "de",
        request,
      );
      expect(
        toAcceptServiceRequest(selected, request, vm).lineItem,
      ).toMatchObject({
        priceCents: 99000,
        pricingMode: ServicePricingMode.Recurring,
        recurringInterval: BillingInterval.Monthly,
      });
    },
  );
  it("keeps the monthly offer after the catalog changes to yearly pricing", () => {
    const request = serviceRequestFixture({
      offeredPriceCents: 99000,
      offeredPricingMode: ServicePricingMode.Recurring,
      offeredRecurringInterval: BillingInterval.Monthly,
    });
    const vm = serviceRequestsViewModelFixture({
      templates: [
        serviceRequestTemplateFixture({
          pricingMode: ServicePricingMode.Recurring,
          recurringInterval: BillingInterval.Yearly,
        }),
      ],
    });
    expect(
      toAcceptServiceRequest(
        createServiceRequestAcceptForm(request, vm, "en"),
        request,
        vm,
      ).lineItem,
    ).toMatchObject({
      priceCents: 99000,
      pricingMode: ServicePricingMode.Recurring,
      recurringInterval: BillingInterval.Monthly,
    });
  });
  it.each([160, 161, 200])(
    "validates a new project title of %i characters while preserving the request title",
    (length) => {
      const request = serviceRequestFixture({
        title: "x".repeat(length),
        projectWish: Mode.New,
      });
      const vm = serviceRequestsViewModelFixture();
      const values = createServiceRequestAcceptForm(request, vm, "en");
      expect(values.projectTitle).toBe(request.title);
      expect(validateServiceRequestAcceptForm(values, request)).toBe(
        length <= 160,
      );
      values.projectTitle = "Short project title";
      expect(validateServiceRequestAcceptForm(values, request)).toBe(true);
      expect(request.title).toHaveLength(length);
    },
  );
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
      acceptWithoutOffer: false,
      project: { mode: Mode.Existing, projectId: request.requestedProjectId },
      template: {
        mode: Mode.Existing,
        lineItemTemplateId: request.lineItemTemplateId,
      },
      lineItem: { priceCents: 12500, quantityMinutes: null },
    });
  });
  it("states acceptance without an offer only when ticked and only before an offer", () => {
    const vm = serviceRequestsViewModelFixture();
    const request = serviceRequestFixture();
    const values = {
      ...createServiceRequestAcceptForm(request, vm, "de"),
      confirmedWithoutOffer: true,
    };
    expect(toAcceptServiceRequest(values, request, vm).acceptWithoutOffer).toBe(
      true,
    );
    expect(
      toAcceptServiceRequest(
        values,
        serviceRequestFixture({ status: ServiceRequestStatus.Offered }),
        vm,
      ).acceptWithoutOffer,
    ).toBe(false);
  });
  it("starts the acceptance from the offered price and hours instead of the catalog", () => {
    const vm = serviceRequestsViewModelFixture();
    expect(
      createServiceRequestAcceptForm(
        serviceRequestFixture({ offeredPriceCents: 99000 }),
        vm,
        "de",
      ).priceInput,
    ).toBe("990");
    expect(
      createServiceRequestAcceptForm(
        serviceRequestFixture({
          kind: LineItemKind.Hours,
          requestedMinutes: 300,
          offeredMinutes: 240,
        }),
        vm,
        "de",
      ).quantityInput,
    ).toBe("4:00");
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
      request,
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
