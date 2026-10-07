import { CredentialSide } from "@invessiv/common/constants/credentials/credential-sides";
import { CredentialType } from "@invessiv/common/constants/credentials/credential-types";
import type { CredentialDto } from "@invessiv/common/contracts/credentials/credential.dto";

/** Metadata-only fixture shared by credential UI tests. */
export function credentialFixture(
  overrides: Partial<CredentialDto> = {},
): CredentialDto {
  return {
    id: "44444444-4444-4444-8444-444444444444",
    customerId: "11111111-1111-4111-8111-111111111111",
    projectId: null,
    title: "Domain bei IONOS",
    credentialType: CredentialType.DomainRegistrar,
    url: "https://example.com/login",
    username: "kunde@example.com",
    hasNote: false,
    visibleToCustomer: false,
    createdBySide: CredentialSide.Internal,
    secretChangedAt: "2026-10-01T08:00:00.000Z",
    lastRevealedAt: null,
    updatedAt: "2026-10-01T08:00:00.000Z",
    version: 1,
    capabilities: { canWrite: true, canReveal: true },
    ...overrides,
  };
}
