// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getCrmCockpitDictionary } from "@/i18n/dictionaries/workspace/crm";
import { OwnerWithoutAccessBadge } from "./owner-without-access-badge";

afterEach(cleanup);

describe("OwnerWithoutAccessBadge", () => {
  const content = getCrmCockpitDictionary("de").ownerAccess;

  it("renders an observation without an action when none is available", () => {
    render(<OwnerWithoutAccessBadge content={content} />);

    expect(screen.getByText(content.observation)).toBeVisible();
    expect(
      screen.queryByRole("button", { name: content.grantAccess }),
    ).not.toBeInTheDocument();
  });

  it("invokes the optional action through the keyboard-accessible button", () => {
    const onGrantAccess = vi.fn();
    render(
      <OwnerWithoutAccessBadge
        content={content}
        onGrantAccessAction={onGrantAccess}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: content.grantAccess }));
    expect(onGrantAccess).toHaveBeenCalledOnce();
  });
});
