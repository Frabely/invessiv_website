import { describe, expect, it } from "vitest";
import { AuthErrorCode } from "@invessiv/common/constants/auth/auth-error-codes";
import { PortalAccessErrorCode } from "@invessiv/common/constants/crm/errors/portal-access-error-codes";
import { getCrmPortalAccessDictionary } from "@/i18n/dictionaries/workspace/crm";
import { portalAccessErrorMessage } from "./portal-access-error-message";

describe("portalAccessErrorMessage", () => {
  const content = getCrmPortalAccessDictionary("de");

  it("shows the actionable reason for expected API failures", () => {
    expect(
      portalAccessErrorMessage(
        PortalAccessErrorCode.AssignmentNotFound,
        content,
      ),
    ).toContain("nicht mehr zugeordnet");
    expect(
      portalAccessErrorMessage(
        PortalAccessErrorCode.InvalidPortalRole,
        content,
      ),
    ).toContain("Portalrolle");
    expect(
      portalAccessErrorMessage(AuthErrorCode.Forbidden, content),
    ).toContain("keine Berechtigung");
  });

  it("reserves the generic message for unknown codes", () => {
    expect(portalAccessErrorMessage("unexpected", content)).toBe(
      content.errors.generic,
    );
  });
});
