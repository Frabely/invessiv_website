// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getCrmLineItemTemplatesDictionary } from "@/i18n/dictionaries/workspace/crm";
import { LineItemTemplatesList } from "./line-item-templates-list";

describe("LineItemTemplatesList", () => {
  it("offers creation for an empty catalog when writing is allowed", () => {
    const content = getCrmLineItemTemplatesDictionary("en");

    render(
      <LineItemTemplatesList
        basePath="/en/crm/line-item-templates"
        canWrite
        content={content}
        createHref="/en/crm/line-item-templates?mode=create"
        hasLineItemTemplates={false}
        includeArchived={false}
        locale="en"
        lineItemTemplates={[]}
        toggleArchivedHref="/en/crm/line-item-templates?includeArchived=true"
      />,
    );

    expect(
      screen.getByText(content.list.empty.description),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: content.list.empty.action }),
    ).toHaveAttribute("href", "/en/crm/line-item-templates?mode=create");
  });
});
