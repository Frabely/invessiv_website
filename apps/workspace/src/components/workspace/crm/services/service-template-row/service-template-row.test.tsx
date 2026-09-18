// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import { ServiceTemplateStatus } from "@invessiv/common/constants/crm/service-template-statuses";
import { getCrmServicesDictionary } from "@/i18n/dictionaries/workspace/crm";
import { ServiceTemplateRow } from "./service-template-row";

describe("ServiceTemplateRow", () => {
  it("hides editing without write access", () => {
    const content = getCrmServicesDictionary("en");

    render(
      <table>
        <tbody>
          <ServiceTemplateRow
            basePath="/en/crm/services"
            canWrite={false}
            content={content}
            includeArchived={false}
            locale="en"
            serviceTemplate={{
              id: "9c8f1a10-1b1a-4a10-8e10-000000000001",
              title: "Landing page",
              description: "",
              priceCents: 200000,
              pricingMode: ServicePricingMode.OneTime,
              recurringInterval: null,
              status: ServiceTemplateStatus.Active,
              version: 1,
              createdAt: "2026-01-01T00:00:00.000Z",
              updatedAt: "2026-01-01T00:00:00.000Z",
            }}
          />
        </tbody>
      </table>,
    );

    expect(screen.getByText("Landing page")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: content.list.edit })).toBeNull();
  });
});
