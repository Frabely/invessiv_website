// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getCrmPortalAccessDictionary } from "@/i18n/dictionaries/workspace/crm";
import { RevokePortalMembershipDialog } from "./revoke-portal-membership-dialog";

afterEach(cleanup);

describe("RevokePortalMembershipDialog", () => {
  it("prevents a second confirmation while revocation is pending", () => {
    const onConfirm = vi.fn();
    const props = {
      content: getCrmPortalAccessDictionary("de"),
      onClose: vi.fn(),
      onConfirm,
    };
    const { rerender } = render(
      <RevokePortalMembershipDialog {...props} busy />,
    );
    expect(
      screen.getByRole("button", { name: "Zugang widerrufen" }),
    ).toBeDisabled();

    rerender(<RevokePortalMembershipDialog {...props} busy={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Zugang widerrufen" }));
    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
