// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { getCrmServicesDictionary } from "@/i18n/dictionaries/workspace/crm";
import { ServiceTemplateFormDialog } from "./service-template-form-dialog";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn() }),
}));

describe("ServiceTemplateFormDialog", () => {
  it("renders the create fields", () => {
    const content = getCrmServicesDictionary("en");

    render(
      <ServiceTemplateFormDialog
        closeHref="/en/crm/services"
        content={content}
        locale="en"
        serviceTemplate={null}
      />,
    );

    expect(
      screen.getByRole("heading", { name: content.form.title.create }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", {
        name: new RegExp(content.form.fields.title),
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText(content.form.fields.status)).toBeNull();
  });
});
