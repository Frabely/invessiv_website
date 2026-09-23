// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ServicePricingMode } from "@invessiv/common/constants/crm/service-pricing-modes";
import { LineItemTemplateStatus } from "@invessiv/common/constants/crm/line-item-template-statuses";
import { getCrmLineItemTemplatesDictionary } from "@/i18n/dictionaries/workspace/crm";
import { LineItemTemplateRow } from "./line-item-template-row";

describe("LineItemTemplateRow", () => {
  it("hides editing without write access", () => {
    const content = getCrmLineItemTemplatesDictionary("en");

    render(
      <table>
        <tbody>
          <LineItemTemplateRow
            basePath="/en/crm/line-item-templates"
            canWrite={false}
            content={content}
            locale="en"
            lineItemTemplate={{
              id: "9c8f1a10-1b1a-4a10-8e10-000000000001",
              title: "Landing page",
              description: "",
              priceCents: 200000,
              pricingMode: ServicePricingMode.OneTime,
              recurringInterval: null,
              status: LineItemTemplateStatus.Active,
              version: 1,
              createdAt: "2026-01-01T00:00:00.000Z",
              updatedAt: "2026-01-01T00:00:00.000Z",
            }}
            queryString=""
          />
        </tbody>
      </table>,
    );

    expect(screen.getByText("Landing page")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: content.list.edit })).toBeNull();
  });
});
