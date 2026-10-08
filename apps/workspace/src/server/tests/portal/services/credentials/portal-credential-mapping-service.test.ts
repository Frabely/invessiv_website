import { describe, expect, it } from "vitest";
import { CredentialSide } from "@invessiv/common/constants/credentials/credential-sides";
import { CredentialType } from "@invessiv/common/constants/credentials/credential-types";
import { portalCredentialMappingService } from "@/server/portal/services/credentials/portal-credential-mapping-service";
import type { PortalCredentialMetadataRow } from "@/server/portal/services/credentials/portal-credential-types";
import type { CredentialRow } from "@/server/shared/services/credential/credential-row-types";

const customerId = "11111111-1111-4111-8111-111111111111";
const projectId = "22222222-2222-4222-8222-222222222222";
const memberId = "33333333-3333-4333-8333-333333333333";
const membershipId = "44444444-4444-4444-8444-444444444444";
const SECRET_CIPHERTEXT = "v1.1.nonce-marker.secret-marker";
const NOTE_CIPHERTEXT = "v1.1.nonce-marker.note-marker";

function metadataRow(
  overrides: Partial<PortalCredentialMetadataRow> = {},
): PortalCredentialMetadataRow {
  return {
    id: "55555555-5555-4555-8555-555555555555",
    project_id: projectId,
    title: "Hosting",
    credential_type: CredentialType.Hosting,
    url: "https://example.com",
    username: "deploy@example.com",
    has_note: true,
    created_by_side: CredentialSide.Internal,
    secret_changed_at: new Date("2026-10-01T08:00:00.000Z"),
    version: 3,
    ...overrides,
  };
}

function fullRow(overrides: Partial<CredentialRow> = {}): CredentialRow {
  return {
    id: "55555555-5555-4555-8555-555555555555",
    customer_id: customerId,
    project_id: null,
    title: "Mail",
    credential_type: CredentialType.Email,
    url: null,
    username: null,
    secret_ciphertext: SECRET_CIPHERTEXT,
    note_ciphertext: NOTE_CIPHERTEXT,
    visible_to_customer: true,
    created_by_side: CredentialSide.Customer,
    created_by_member_id: null,
    created_by_portal_membership_id: membershipId,
    secret_changed_at: new Date("2026-10-01T08:00:00.000Z"),
    last_revealed_at: new Date("2026-10-02T09:30:00.000Z"),
    version: 1,
    created_at: new Date("2026-09-30T07:00:00.000Z"),
    updated_at: new Date("2026-10-01T08:00:00.000Z"),
    ...overrides,
  };
}

describe("portalCredentialMappingService.toDto", () => {
  it("maps every released column to its camelCase field", () => {
    expect(portalCredentialMappingService.toDto(metadataRow())).toEqual({
      id: "55555555-5555-4555-8555-555555555555",
      projectId,
      title: "Hosting",
      credentialType: CredentialType.Hosting,
      url: "https://example.com",
      username: "deploy@example.com",
      hasNote: true,
      createdByCustomer: false,
      secretChangedAt: "2026-10-01T08:00:00.000Z",
      version: 3,
    });
  });

  it("keeps nullable fields null and names only the origin side", () => {
    expect(
      portalCredentialMappingService.toDto(
        metadataRow({
          project_id: null,
          url: null,
          username: null,
          has_note: false,
          created_by_side: CredentialSide.Customer,
        }),
      ),
    ).toMatchObject({
      projectId: null,
      url: null,
      username: null,
      hasNote: false,
      createdByCustomer: true,
    });
  });
});

describe("portalCredentialMappingService.fromRow", () => {
  it("derives hasNote and carries no ciphertext, release state or internal id", () => {
    const dto = portalCredentialMappingService.fromRow(
      fullRow({ created_by_member_id: memberId }),
    );
    const serialized = JSON.stringify(dto);

    expect(dto.hasNote).toBe(true);
    expect(dto.createdByCustomer).toBe(true);
    expect(Object.keys(dto).sort()).toEqual(
      [
        "createdByCustomer",
        "credentialType",
        "hasNote",
        "id",
        "projectId",
        "secretChangedAt",
        "title",
        "url",
        "username",
        "version",
      ].sort(),
    );
    for (const forbidden of [
      SECRET_CIPHERTEXT,
      NOTE_CIPHERTEXT,
      customerId,
      memberId,
      membershipId,
      "2026-10-02T09:30:00.000Z",
    ])
      expect(serialized).not.toContain(forbidden);
  });

  it("reports a missing note", () => {
    expect(
      portalCredentialMappingService.fromRow(fullRow({ note_ciphertext: null }))
        .hasNote,
    ).toBe(false);
  });
});
