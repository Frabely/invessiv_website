// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { getCrmServicesDictionary } from "@/i18n/dictionaries/workspace/crm";
import { ServiceTemplatesList } from "./service-templates-list";

describe("ServiceTemplatesList", () => {
  it("offers creation for an empty catalog when writing is allowed", () => {
    const content = getCrmServicesDictionary("en");

    render(
      <ServiceTemplatesList
        basePath="/en/crm/services"
        canWrite
        content={content}
        createHref="/en/crm/services?mode=create"
        hasServiceTemplates={false}
        includeArchived={false}
        locale="en"
        serviceTemplates={[]}
        toggleArchivedHref="/en/crm/services?includeArchived=true"
      />,
    );

    expect(
      screen.getByText(content.list.empty.description),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: content.list.empty.action }),
    ).toHaveAttribute("href", "/en/crm/services?mode=create");
  });
});
