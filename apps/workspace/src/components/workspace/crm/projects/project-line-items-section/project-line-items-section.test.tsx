// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { BillingInterval } from "@invessiv/common/constants/crm/billing-intervals";
import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import type { ProjectLineItemDto } from "@invessiv/common/contracts/crm/project-line-item.dto";
import { getCrmProjectLineItemsDictionary } from "@/i18n/dictionaries/workspace/crm";
import { ProjectLineItemsSection } from "./project-line-items-section";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

const PROJECT_ID = "33333333-3333-4333-8333-333333333333";
const TEMPLATE_ID = "9c8f1a10-1b1a-4a10-8e10-00000000f001";

function service(
  overrides: Partial<ProjectLineItemDto> = {},
): ProjectLineItemDto {
  return {
    id: "55555555-5555-4555-8555-555555555555",
    projectId: PROJECT_ID,
    sourceLineItemTemplateId: TEMPLATE_ID,
    title: "Landingpage",
    description: "Einseitige Website inklusive Konzept und Umsetzung.",
    priceCents: 200000,
    pricingMode: ServicePricingMode.OneTime,
    recurringInterval: null,
    version: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function expandSection(
  content: ReturnType<typeof getCrmProjectLineItemsDictionary>,
) {
  fireEvent.click(
    screen.getByRole("button", { name: content.section.expandLabel }),
  );
}

describe("ProjectLineItemsSection", () => {
  afterEach(cleanup);

  it("explains what the area is for and offers the assignment when writing is allowed", () => {
    const content = getCrmProjectLineItemsDictionary("en");

    render(
      <ProjectLineItemsSection
        canWrite
        catalogHref="/en/crm/line-item-templates"
        content={content}
        locale="en"
        projectId={PROJECT_ID}
        services={[]}
        templates={[]}
      />,
    );
    expandSection(content);

    expect(screen.getByText(content.empty.description)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: content.section.assignAction }),
    ).toBeInTheDocument();
  });

  it("points at the catalog when it holds no assignable template yet", () => {
    const content = getCrmProjectLineItemsDictionary("en");

    render(
      <ProjectLineItemsSection
        canWrite
        catalogHref="/en/crm/line-item-templates"
        content={content}
        locale="en"
        projectId={PROJECT_ID}
        services={[]}
        templates={[]}
      />,
    );
    expandSection(content);

    expect(
      screen.getByRole("link", { name: content.form.noTemplates.action }),
    ).toHaveAttribute("href", "/en/crm/line-item-templates");
  });

  it("shows no write action and a read-only explanation without write access", () => {
    const content = getCrmProjectLineItemsDictionary("de");

    render(
      <ProjectLineItemsSection
        canWrite={false}
        catalogHref={null}
        content={content}
        locale="de"
        projectId={PROJECT_ID}
        services={[]}
        templates={[]}
      />,
    );
    expandSection(content);

    expect(
      screen.getByText(content.emptyReadOnly.description),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: content.section.assignAction }),
    ).toBeNull();
  });

  it("renders every service with its own price and cadence", () => {
    const content = getCrmProjectLineItemsDictionary("de");

    render(
      <ProjectLineItemsSection
        canWrite={false}
        catalogHref={null}
        content={content}
        locale="de"
        projectId={PROJECT_ID}
        services={[
          service(),
          service({
            id: "66666666-6666-4666-8666-666666666666",
            title: "Wartung",
            priceCents: 10000,
            pricingMode: ServicePricingMode.Recurring,
            recurringInterval: BillingInterval.Monthly,
          }),
        ]}
        templates={[]}
      />,
    );
    expandSection(content);

    expect(
      screen.getByRole("list", { name: content.list.ariaLabel }),
    ).toBeInTheDocument();
    expect(screen.getByText("Landingpage")).toBeInTheDocument();
    expect(screen.getByText(content.list.cadence.one_time)).toBeInTheDocument();
    expect(screen.getByText(content.list.cadence.monthly)).toBeInTheDocument();
  });

  it("marks a snapshot whose origin template was deleted without changing its values", () => {
    const content = getCrmProjectLineItemsDictionary("de");

    render(
      <ProjectLineItemsSection
        canWrite={false}
        catalogHref={null}
        content={content}
        locale="de"
        projectId={PROJECT_ID}
        services={[service({ sourceLineItemTemplateId: null })]}
        templates={[]}
      />,
    );
    expandSection(content);

    expect(screen.getByText(content.list.templateRemoved)).toBeInTheDocument();
    expect(screen.getByText("Landingpage")).toBeInTheDocument();
  });

  it("makes each row editable when writing is allowed", () => {
    const content = getCrmProjectLineItemsDictionary("en");

    render(
      <ProjectLineItemsSection
        canWrite
        catalogHref="/en/crm/line-item-templates"
        content={content}
        locale="en"
        projectId={PROJECT_ID}
        services={[service()]}
        templates={[]}
      />,
    );
    expandSection(content);

    expect(
      screen.getByRole("button", { name: /Landingpage/ }),
    ).toBeInTheDocument();
  });

  it("starts collapsed and still offers the assignment from the header", () => {
    const content = getCrmProjectLineItemsDictionary("en");

    render(
      <ProjectLineItemsSection
        canWrite
        catalogHref="/en/crm/line-item-templates"
        content={content}
        locale="en"
        projectId={PROJECT_ID}
        services={[service()]}
        templates={[]}
      />,
    );

    expect(
      screen.queryByRole("list", { name: content.list.ariaLabel }),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: content.section.expandLabel }),
    ).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(
      screen.getByRole("button", { name: content.section.assignAction }),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("keeps both project values visible in the collapsed header", () => {
    const content = getCrmProjectLineItemsDictionary("de");
    render(
      <ProjectLineItemsSection
        canWrite
        catalogHref={null}
        content={content}
        locale="de"
        projectId={PROJECT_ID}
        services={[service()]}
        templates={[]}
        value={{ oneTimeCents: 275000, monthlyCents: 10000 }}
      />,
    );

    const header = screen
      .getByRole("heading", {
        name: content.section.title,
      })
      .closest("header");
    expect(header).toHaveTextContent(content.values.oneTime);
    expect(header).toHaveTextContent(content.values.monthly);
    expect(header).toHaveTextContent("2.750,00");
    expect(header).toHaveTextContent("100,00");
    expect(
      screen.queryByRole("list", { name: content.list.ariaLabel }),
    ).toBeNull();
  });
});
