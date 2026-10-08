import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ContactDatabaseTransaction } from "@invessiv/db/core";
import { CredentialApiErrorCode } from "@invessiv/common/constants/credentials/credential-api-error-code";
import { CredentialSide } from "@invessiv/common/constants/credentials/credential-sides";
import { credentialAccessService } from "@/server/workspace/crm/services/credentials/credential-access-service";

const projectVisible = vi.hoisted(() => vi.fn());
vi.mock("server-only", () => ({}));
vi.mock(
  "@/server/shared/services/credential/credential-portal-project-service",
  () => ({
    credentialPortalProjectService: { isProjectPortalVisible: projectVisible },
  }),
);

const tx = {} as ContactDatabaseTransaction;
const row = {
  created_by_side: CredentialSide.Internal,
  visible_to_customer: true,
  project_id: "hidden-project",
};

beforeEach(() => {
  projectVisible.mockReset().mockResolvedValue(false);
});

describe("credential release validation", () => {
  it.each([true, undefined])(
    "accepts an unchanged release on a now-hidden project (%s)",
    async (requested) => {
      expect(
        await credentialAccessService.portalVisibilityError(tx, row, requested),
      ).toBeNull();
      expect(projectVisible).not.toHaveBeenCalled();
    },
  );

  it("rejects a new release on a hidden destination", async () => {
    expect(
      await credentialAccessService.portalVisibilityError(
        tx,
        { ...row, visible_to_customer: false },
        true,
      ),
    ).toBe(CredentialApiErrorCode.ProjectHidden);
    expect(projectVisible).toHaveBeenCalledExactlyOnceWith(tx, row.project_id);
  });

  it("permits a release on a visible project and a withdrawal on a hidden project", async () => {
    projectVisible.mockResolvedValue(true);
    expect(
      await credentialAccessService.portalVisibilityError(
        tx,
        { ...row, visible_to_customer: false },
        true,
      ),
    ).toBeNull();
    projectVisible.mockClear();
    expect(
      await credentialAccessService.portalVisibilityError(tx, row, false),
    ).toBeNull();
    expect(projectVisible).not.toHaveBeenCalled();
  });

  it("rejects withdrawal of a customer-owned entry", async () => {
    expect(
      await credentialAccessService.portalVisibilityError(
        tx,
        { ...row, created_by_side: CredentialSide.Customer },
        false,
      ),
    ).toBe(CredentialApiErrorCode.CustomerOwned);
    expect(projectVisible).not.toHaveBeenCalled();
  });
});
