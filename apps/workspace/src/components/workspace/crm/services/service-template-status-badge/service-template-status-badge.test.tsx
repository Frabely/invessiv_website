// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ServiceTemplateStatus } from "@invessiv/common/constants/crm/service-template-statuses";
import { ServiceTemplateStatusBadge } from "./service-template-status-badge";

describe("ServiceTemplateStatusBadge", () => {
  it("renders the supplied archived status label", () => {
    render(
      <ServiceTemplateStatusBadge
        label="Archived"
        status={ServiceTemplateStatus.Archived}
      />,
    );

    expect(screen.getByText("Archived")).toBeInTheDocument();
  });
});
