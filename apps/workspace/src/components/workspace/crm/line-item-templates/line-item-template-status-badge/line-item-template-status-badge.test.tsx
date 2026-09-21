// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LineItemTemplateStatus } from "@invessiv/common/constants/crm/line-item-template-statuses";
import { LineItemTemplateStatusBadge } from "./line-item-template-status-badge";

describe("LineItemTemplateStatusBadge", () => {
  it("renders the supplied archived status label", () => {
    render(
      <LineItemTemplateStatusBadge
        label="Archived"
        status={LineItemTemplateStatus.Archived}
      />,
    );

    expect(screen.getByText("Archived")).toBeInTheDocument();
  });
});
