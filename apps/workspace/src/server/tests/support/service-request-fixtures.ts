import { LineItemKind } from "@invessiv/common/constants/crm/line-item-kinds";
import { LineItemProjectMode } from "@invessiv/common/constants/crm/line-item-project-modes";
import { LineItemTemplateStatus } from "@invessiv/common/constants/crm/line-item-template-statuses";
import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import { ServiceRequestStatus } from "@invessiv/common/constants/crm/service-request-statuses";
import { ServiceRequestProjectWish } from "@invessiv/common/constants/crm/service-request-project-wishes";
import type { LineItemTemplateDto } from "@invessiv/common/contracts/crm/line-item-template.dto";
import type { ServiceRequestDto } from "@invessiv/common/contracts/crm/service-requests/service-request.dto";
import type { ServiceRequestsViewModel } from "@/common/contracts/crm/service-requests-view-model";
import { createDefaultProcessPlan } from "@/common/patterns/crm/project-process-plan";
import { getCrmCockpitDictionary } from "@/i18n/dictionaries/workspace/crm";

export function serviceRequestFixture(
  overrides: Partial<ServiceRequestDto> = {},
): ServiceRequestDto {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    customerId: "22222222-2222-4222-8222-222222222222",
    customerDisplayName: "Nordlicht",
    customerNumber: 42,
    lineItemTemplateId: "33333333-3333-4333-8333-333333333333",
    kind: LineItemKind.Standard,
    title: "New service",
    note: "<b>Customer text</b>",
    requestedMinutes: null,
    projectWish: ServiceRequestProjectWish.Existing,
    requestedProjectId: "44444444-4444-4444-8444-444444444444",
    requestedProjectTitle: "Website",
    requestedByName: "Anna Berger",
    status: ServiceRequestStatus.Requested,
    declineReason: null,
    offeredAt: null,
    offeredPriceCents: null,
    offeredMinutes: null,
    decidedAt: null,
    projectId: null,
    projectLineItemId: null,
    version: 1,
    createdAt: "2026-10-11T08:00:00.000Z",
    ...overrides,
  };
}
export function serviceRequestTemplateFixture(
  overrides: Partial<LineItemTemplateDto> = {},
): LineItemTemplateDto {
  return {
    id: serviceRequestFixture().lineItemTemplateId!,
    title: "Catalog service",
    description: "Internal scope",
    priceCents: 12500,
    pricingMode: ServicePricingMode.OneTime,
    recurringInterval: null,
    kind: LineItemKind.Standard,
    projectMode: LineItemProjectMode.ExistingProject,
    portalRequestable: true,
    portalDescription: "Customer catalog text",
    status: LineItemTemplateStatus.Active,
    version: 1,
    createdAt: "2026-10-11T08:00:00.000Z",
    updatedAt: "2026-10-11T08:00:00.000Z",
    ...overrides,
  };
}
export function serviceRequestsViewModelFixture(
  overrides: Partial<ServiceRequestsViewModel> = {},
): ServiceRequestsViewModel {
  const phases = getCrmCockpitDictionary("en").projects.phases;
  return {
    requests: [serviceRequestFixture()],
    canWrite: true,
    canCreateProject: true,
    canCreateTemplate: true,
    canReadTemplates: true,
    projects: [
      { id: serviceRequestFixture().requestedProjectId!, title: "Website" },
    ],
    templates: [serviceRequestTemplateFixture()],
    blockers: {},
    defaultPlan: createDefaultProcessPlan((phase) => phases[phase]),
    selectedRequestId: null,
    ...overrides,
  };
}
