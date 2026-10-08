import { CredentialType } from "@invessiv/common/constants/credentials/credential-types";
import type { PortalCredentialListDto } from "@invessiv/common/contracts/portal/portal-credential-list.dto";
import type { PortalCredentialDto } from "@invessiv/common/contracts/portal/portal-credential.dto";

/** Metadata-only fixtures shared by the portal credential UI tests. */
export function portalCredentialFixture(
  overrides: Partial<PortalCredentialDto> = {},
): PortalCredentialDto {
  return {
    id: "44444444-4444-4444-8444-444444444444",
    projectId: null,
    title: "Domain bei IONOS",
    credentialType: CredentialType.DomainRegistrar,
    url: "https://example.com/login",
    username: "kunde@example.com",
    hasNote: false,
    createdByCustomer: false,
    secretChangedAt: "2026-10-01T08:00:00.000Z",
    version: 1,
    ...overrides,
  };
}

export function portalCredentialListFixture(
  overrides: Partial<PortalCredentialListDto> = {},
): PortalCredentialListDto {
  return {
    credentials: [portalCredentialFixture()],
    projects: [],
    capabilities: { canWrite: true, canReveal: true },
    configured: true,
    ...overrides,
  };
}
